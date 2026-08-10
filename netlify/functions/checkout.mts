// Netlify Function backing the storefront's "Kjøp nå" button.
//
// The button performs a plain GET navigation to `/api/checkout?slug=…&ref=…`.
// Earlier the storefront linked each product straight to a hard-coded
// `buy.stripe.com/test_…` URL. Those placeholder links no longer resolve to a
// real payment page — the request lands on Stripe's object storage and returns
// an "AccessDenied" XML document, which is the error shoppers were seeing.
//
// The fix routes every purchase through this endpoint instead: it looks the
// product up in the Netlify Database (the same source of truth the admin and
// storefront use), creates a real Stripe Checkout Session priced in NOK, then
// 303-redirects the visitor to Stripe's hosted checkout. The influencer
// referral (`ref`) is carried into the session metadata so a sale can be
// attributed to the curator who drove it.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";

function siteUrl(): string {
  return Netlify.env.get("URL") || "https://scandijapandi.no";
}

function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}

// Unwrap an error into a single readable line. The database driver reports
// query failures as a terse "Failed query: <sql>" message and hides the real
// reason (auth, TLS, missing connection string) on `cause`, so log the whole
// chain — otherwise every outage looks identical in the function log.
function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const parts = [`${err.name}: ${err.message}`];
  let cause: unknown = (err as { cause?: unknown }).cause;
  while (cause instanceof Error) {
    const code = (cause as { code?: string }).code;
    parts.push(`caused by ${cause.name}: ${cause.message}${code ? ` (code=${code})` : ""}`);
    cause = (cause as { cause?: unknown }).cause;
  }
  if (cause !== undefined && !(cause instanceof Error)) parts.push(`caused by ${String(cause)}`);
  return parts.join(" | ");
}

async function fetchProduct(
  slug: string,
): Promise<{ name?: string; price_nok?: number } | null> {
  console.log(`[checkout] product lookup: slug=${JSON.stringify(slug)}`);
  const rows = await db.sql`
    SELECT name, price_nok FROM products
    WHERE slug = ${slug} AND active = TRUE
    LIMIT 1
  `;
  const row = rows[0] ?? null;
  console.log(
    `[checkout] product lookup returned ${rows.length} row(s): ${JSON.stringify(row)}`,
  );
  return row;
}

async function createCheckoutSession(opts: {
  name: string;
  amountMinor: number;
  curator: string;
  slug: string;
  locale: string;
}): Promise<string> {
  const key = Netlify.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][price_data][currency]", "nok");
  form.set("line_items[0][price_data][product_data][name]", opts.name);
  form.set("line_items[0][price_data][unit_amount]", String(opts.amountMinor));
  form.set("line_items[0][quantity]", "1");
  for (const country of ["NO", "SE", "DK", "FI", "JP"]) {
    form.append("shipping_address_collection[allowed_countries][]", country);
  }
  // Collect a phone number so the producer-notification email can include it.
  form.set("phone_number_collection[enabled]", "true");
  if (opts.curator) form.set("client_reference_id", opts.curator);
  form.set("metadata[curator]", opts.curator);
  form.set("metadata[slug]", opts.slug);
  form.set("metadata[locale]", opts.locale);
  form.set("success_url", `${siteUrl()}/order-confirmed?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${siteUrl()}/?checkout=cancel`);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const session = await res.json().catch(() => null);
  if (!res.ok || !session?.url) {
    // Log Stripe's own explanation — status alone can't distinguish a bad key
    // from an invalid amount from a rejected shipping country.
    console.error(
      `[checkout] Stripe session creation failed: HTTP ${res.status} ${res.statusText} body=${JSON.stringify(session)}`,
    );
    const detail = session?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Stripe session creation failed: ${detail}`);
  }
  return session.url as string;
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug") || "";
    const curator = url.searchParams.get("ref") || url.searchParams.get("client_reference_id") || "";
    console.log(`[checkout] slug=${slug} locale=${url.searchParams.get("locale")} ref=${curator}`);

    if (!slug || slug === "undefined") {
      return redirect(`${siteUrl()}/?checkout=error&reason=missing-slug`);
    }

    const product = await fetchProduct(slug);
    if (!product || typeof product.price_nok !== "number") {
      console.error(
        `[checkout] no purchasable product for slug=${JSON.stringify(slug)} (row=${JSON.stringify(product)})`,
      );
      return redirect(`${siteUrl()}/?checkout=error&reason=not-found`);
    }

    const checkoutUrl = await createCheckoutSession({
      name: product.name || "ScandiJapandi",
      amountMinor: Math.round(Number(product.price_nok) * 100),
      curator,
      slug,
      locale: url.searchParams.get("locale") || "en",
    });

    return redirect(checkoutUrl);
  } catch (err) {
    console.error(`[checkout] unhandled failure: ${describeError(err)}`);
    if (err instanceof Error && err.stack) console.error(err.stack);
    return redirect(`${siteUrl()}/?checkout=error`);
  }
};

export const config: Config = {
  path: "/api/checkout",
};
