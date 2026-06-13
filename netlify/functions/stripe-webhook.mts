// Stripe webhook — the engine behind automatic order handling.
//
// Stripe calls this endpoint after a customer completes payment
// (`checkout.session.completed`). The function:
//   1. Verifies the Stripe signature (HMAC-SHA256 over the raw body) so only
//      genuine Stripe events are processed.
//   2. Looks the purchased product up in the Netlify Database to find the
//      producer's email address (added in the products admin).
//   3. Records the order in the `orders` table — idempotently, keyed on the
//      Stripe session id, so Stripe's automatic retries never double-send.
//   4. Emails the producer a professional "ny bestilling er mottatt" notice
//      with the product, customer (name, address, phone) and order reference.
//
// Configure the endpoint in the Stripe dashboard to POST to
// `/api/stripe/webhook` and copy its signing secret into STRIPE_WEBHOOK_SECRET.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { sendEmail } from "../lib/send-email.mts";
import {
  orderEmailHtml,
  orderEmailSubject,
  orderEmailText,
  type OrderEmailData,
} from "../lib/order-email.mts";

// ---- Stripe signature verification (Web Crypto, no SDK) -------------------

function hexFromBuffer(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const idx = kv.indexOf("=");
      return [kv.slice(0, idx).trim(), kv.slice(idx + 1).trim()];
    }),
  );
  const timestamp = parts["t"];
  const expectedSig = parts["v1"];
  if (!timestamp || !expectedSig) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const computed = hexFromBuffer(mac);
  if (!timingSafeEqual(computed, expectedSig)) return false;

  // Reject events whose timestamp is outside the tolerance window. Date.now()
  // is unavailable in some sandboxes; guard so verification still works.
  try {
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (Number.isFinite(age) && age > toleranceSeconds) return false;
  } catch {
    /* clock unavailable — signature match alone is acceptable */
  }
  return true;
}

// ---- Helpers --------------------------------------------------------------

function formatAddress(a: any, name?: string | null): string {
  if (!a) return name ? String(name) : "";
  const lines = [
    name || undefined,
    a.line1 || undefined,
    a.line2 || undefined,
    [a.postal_code, a.city].filter(Boolean).join(" ") || undefined,
    a.state || undefined,
    a.country || undefined,
  ].filter(Boolean);
  return lines.join("\n");
}

function formatNok(amountMinor: unknown, currency: string): string {
  const major = Number(amountMinor) / 100;
  if (!Number.isFinite(major)) return "";
  try {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: (currency || "NOK").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(major);
  } catch {
    return `${Math.round(major)} ${(currency || "NOK").toUpperCase()}`;
  }
}

async function fetchProductForEmail(slug: string) {
  const rows = await db.sql`
    SELECT name, producer, producer_email, price_nok
    FROM products WHERE slug = ${slug} LIMIT 1
  `;
  return rows[0] ?? null;
}

// ---- Handler --------------------------------------------------------------

export default async (req: Request) => {
  const secret = Netlify.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return new Response("Webhook not configured", { status: 500 });
  }

  // The raw body is required for signature verification — read it as text.
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const valid = await verifyStripeSignature(rawBody, signature, secret);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  // Only completed checkouts trigger a producer notification. Acknowledge
  // everything else with 200 so Stripe stops retrying.
  if (event?.type !== "checkout.session.completed") {
    return new Response("Ignored", { status: 200 });
  }

  const session = event.data?.object ?? {};
  const sessionId: string = session.id;
  if (!sessionId) return new Response("No session id", { status: 200 });

  try {
    const metadata = session.metadata ?? {};
    const slug: string = metadata.slug || "";
    const curator: string = metadata.curator || session.client_reference_id || "";

    const customer = session.customer_details ?? {};
    const shipping = session.shipping_details ?? session.collected_information?.shipping_details ?? {};
    const shippingAddress = formatAddress(
      shipping.address ?? customer.address,
      shipping.name ?? customer.name,
    );

    // Persist the order idempotently. If the row already exists (Stripe retry),
    // INSERT … ON CONFLICT DO NOTHING returns no row and we skip re-emailing.
    const product = slug ? await fetchProductForEmail(slug) : null;
    const items = JSON.stringify([
      {
        slug,
        name: product?.name ?? null,
        producer_email: product?.producer_email ?? null,
        phone: customer.phone ?? null,
      },
    ]);

    const inserted = await db.sql`
      INSERT INTO orders (
        stripe_session_id, session_id, curator, source,
        customer_email, customer_name, shipping_address, delivery_notes,
        items, amount_total, currency, routing_status, producer_endpoint
      ) VALUES (
        ${sessionId}, ${metadata.session_id || null}, ${curator || null}, ${"stripe"},
        ${customer.email || null}, ${customer.name || null}, ${shippingAddress || null},
        ${customer.phone || null},
        ${items}::jsonb, ${String(session.amount_total ?? "")}, ${session.currency || "nok"},
        ${"pending"}, ${product?.producer_email || null}
      )
      ON CONFLICT (stripe_session_id) DO NOTHING
      RETURNING id
    `;

    if (!inserted.length) {
      // Already processed — acknowledge without sending a duplicate email.
      return new Response("Already processed", { status: 200 });
    }

    if (!product?.producer_email) {
      console.error(
        `[stripe-webhook] no producer_email for slug "${slug}" (session ${sessionId}); order stored, email skipped`,
      );
      await db.sql`UPDATE orders SET routing_status = ${"no-producer-email"}, updated_at = NOW() WHERE stripe_session_id = ${sessionId}`;
      return new Response("Stored without producer email", { status: 200 });
    }

    const emailData: OrderEmailData = {
      productName: product.name || slug || "Produkt",
      productSlug: slug,
      producerName: product.producer,
      quantity: 1,
      amountFormatted: formatNok(session.amount_total, session.currency || "nok"),
      orderRef: sessionId,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shippingAddress,
      curator,
    };

    const result = await sendEmail({
      to: product.producer_email,
      subject: orderEmailSubject(emailData),
      html: orderEmailHtml(emailData),
      text: orderEmailText(emailData),
      replyTo: customer.email || undefined,
    });

    const status =
      result.status === "sent" ? "emailed" : result.status === "skipped" ? "email-skipped" : "email-failed";
    if (result.status !== "sent") {
      console.error(`[stripe-webhook] producer email ${result.status}: ${result.reason}`);
    }
    await db.sql`UPDATE orders SET routing_status = ${status}, updated_at = NOW() WHERE stripe_session_id = ${sessionId}`;

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[stripe-webhook]", err instanceof Error ? err.message : err);
    // Return 500 so Stripe retries — the insert is idempotent, so a retry that
    // succeeds will not double-send.
    return new Response("Processing error", { status: 500 });
  }
};

export const config: Config = {
  path: "/api/stripe/webhook",
};
