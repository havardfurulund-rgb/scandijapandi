import type { Config, Context } from "@netlify/functions";
import Stripe from "stripe";
import { db } from "../../db/index.js";
import { sessions } from "../../db/schema.js";
import { buildDiagnostic, logDiagnostic } from "../../lib/diagnostics.mjs";

const FUNCTION_NAME = "create-checkout";

function getStripe(): Stripe {
  const key = Netlify.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

function parseSjContext(cookieValue: string | undefined): Record<string, string> {
  if (!cookieValue) return {};
  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    return {};
  }
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const stripe = getStripe();
    const body = await req.json();
    const { items, successUrl, cancelUrl } = body as {
      items: Array<{ priceId: string; quantity?: number }>;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "items array is required" }, { status: 400 });
    }

    const sjCookie = context.cookies.get("sj_context");
    const sjContext = parseSjContext(sjCookie);

    const siteUrl = Netlify.env.get("URL") || "https://scandijapandi.no";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      shipping_address_collection: {
        allowed_countries: ["JP", "NO", "SE", "DK", "FI"],
      },
      line_items: items.map((item) => ({
        price: item.priceId,
        quantity: item.quantity || 1,
      })),
      metadata: {
        curator: sjContext.curator || "",
        source: sjContext.source || "",
        sessionId: sjContext.sessionId || "",
      },
      success_url: successUrl || `${siteUrl}/?checkout=success`,
      cancel_url: cancelUrl || `${siteUrl}/?checkout=cancel`,
    });

    if (sjContext.sessionId) {
      context.waitUntil(
        db
          .insert(sessions)
          .values({
            sessionId: sjContext.sessionId,
            curator: sjContext.curator || null,
            source: sjContext.source || null,
            landingUrl: req.headers.get("referer") || null,
            ipAddress: context.ip,
          })
          .onConflictDoNothing()
          .catch(() => {})
      );
    }

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    const diagnostic = buildDiagnostic(FUNCTION_NAME, error, {
      requestId: context.requestId,
    });
    await logDiagnostic(diagnostic);
    console.error(`[${FUNCTION_NAME}]`, JSON.stringify(diagnostic));
    return Response.json({ error: "Checkout session creation failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/checkout",
  method: "POST",
};
