import type { Config, Context } from "@netlify/functions";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orders } from "../../db/schema.js";
import { buildDiagnostic, logDiagnostic } from "../../lib/diagnostics.mjs";

const FUNCTION_NAME = "stripe-webhook";

function getStripe(): Stripe {
  const key = Netlify.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

interface ProducerConfig {
  endpoint: string;
  active: boolean;
  ddpSupported: boolean;
}

function getProducerConfig(curator: string): ProducerConfig | null {
  const configJson = Netlify.env.get("PRODUCER_ENDPOINTS");
  if (!configJson) return null;
  try {
    const producers = JSON.parse(configJson) as Record<string, ProducerConfig>;
    return producers[curator] || null;
  } catch {
    return null;
  }
}

function buildOrderPayload(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  return {
    stripeSessionId: session.id,
    customerEmail: session.customer_details?.email || null,
    customerName: session.customer_details?.name || null,
    shippingAddress: session.shipping_details
      ? JSON.stringify(session.shipping_details.address)
      : null,
    curator: metadata.curator || null,
    source: metadata.source || null,
    sessionId: metadata.sessionId || null,
    amountTotal: session.amount_total?.toString() || null,
    currency: session.currency || null,
  };
}

async function forwardToProducer(
  producer: ProducerConfig,
  orderPayload: Record<string, unknown>
): Promise<boolean> {
  const response = await fetch(producer.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Delivery-Terms": producer.ddpSupported ? "DDP" : "DAP",
    },
    body: JSON.stringify(orderPayload),
  });
  return response.ok;
}

async function triggerBackgroundRetry(orderPayload: Record<string, unknown>) {
  const siteUrl = Netlify.env.get("URL") || "";
  await fetch(`${siteUrl}/.netlify/functions/stripe-webhook-background`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripe = getStripe();
  const webhookSecret = Netlify.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    const diagnostic = buildDiagnostic(FUNCTION_NAME, new Error("STRIPE_WEBHOOK_SECRET not configured"), {
      requestId: context.requestId,
    });
    await logDiagnostic(diagnostic);
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const diagnostic = buildDiagnostic(FUNCTION_NAME, error, {
      requestId: context.requestId,
      metadata: { phase: "signature_verification" },
    });
    await logDiagnostic(diagnostic);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderPayload = buildOrderPayload(session);

    await db.insert(orders).values({
      ...orderPayload,
      routingStatus: "pending",
    });

    const curator = orderPayload.curator;
    if (curator) {
      const producer = getProducerConfig(curator);
      if (producer?.active) {
        const forwarded = await forwardToProducer(producer, orderPayload);
        if (forwarded) {
          await db
            .update(orders)
            .set({
              routingStatus: "routed_to_producer",
              producerEndpoint: producer.endpoint,
              updatedAt: new Date(),
            })
            .where(
              eq(orders.stripeSessionId, session.id)
            );
        } else {
          context.waitUntil(triggerBackgroundRetry(orderPayload));
        }
      }
    }

    return Response.json({ received: true, orderId: session.id });
  } catch (error) {
    const diagnostic = buildDiagnostic(FUNCTION_NAME, error, {
      requestId: context.requestId,
      metadata: { phase: "order_processing", eventType: event.type },
    });
    await logDiagnostic(diagnostic);
    console.error(`[${FUNCTION_NAME}]`, JSON.stringify(diagnostic));
    return Response.json({ error: "Order processing failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/stripe-webhook",
  method: "POST",
};
