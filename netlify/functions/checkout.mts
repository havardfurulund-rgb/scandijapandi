// Netlify Function backing the storefront's "Kjøp nå" button.
//
// The button performs a plain GET navigation to `/api/checkout?slug=…&ref=…`.
// Because the storefront is a *static* Astro build (no SSR adapter, see
// astro.config.mjs), there is no server runtime for an Astro API route. A
// Netlify Function is the platform-native way to add this endpoint without
// converting the whole site to server rendering.
//
// Flow: look up the product in Sanity by slug to get its name + price, create a
// Stripe Checkout Session for it, then 303-redirect the visitor to Stripe's
// hosted checkout page. The curator referral (`ref`) is carried into the
// session metadata so downstream order handling can attribute the sale.

const SANITY_API_VERSION = "v2021-06-07";

// Public Sanity project id. Kept in sync with `astro.config.mjs`, where the same
// value is hardcoded for the build-time `sanity:client`. Falls back here so the
// checkout endpoint keeps working even when no env var is configured.
const DEFAULT_SANITY_PROJECT_ID = "v7f0k69w";

function siteUrl(): string {
  return process.env.URL || "https://scandijapandi.no";
}

function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}

async function fetchProduct(slug: string): Promise<{ title?: string; price?: number } | null> {
  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || DEFAULT_SANITY_PROJECT_ID;
  const dataset = process.env.PUBLIC_SANITY_DATASET || "production";

  const query = `*[_type == "product" && slug.current == $slug][0]{title, price}`;
  const url =
    `https://${projectId}.apicdn.sanity.io/${SANITY_API_VERSION}/data/query/${dataset}` +
    `?query=${encodeURIComponent(query)}` +
    `&$slug=${encodeURIComponent(JSON.stringify(slug))}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
  const json = await res.json();
  return json.result ?? null;
}

async function createCheckoutSession(opts: {
  name: string;
  amountMinor: number;
  curator: string;
  slug: string;
}): Promise<string> {
  const key = process.env.STRIPE_SECRET_KEY;
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
  form.set("metadata[curator]", opts.curator);
  form.set("metadata[slug]", opts.slug);
  form.set("success_url", `${siteUrl()}/?checkout=success`);
  form.set("cancel_url", `${siteUrl()}/?checkout=cancel`);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const session = await res.json();
  if (!res.ok || !session.url) {
    throw new Error(`Stripe session creation failed: ${res.status}`);
  }
  return session.url as string;
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || "";
  const curator = url.searchParams.get("ref") || "";

  if (!slug || slug === "undefined") {
    return redirect(`${siteUrl()}/?checkout=error&reason=missing-slug`);
  }

  try {
    const product = await fetchProduct(slug);
    if (!product || typeof product.price !== "number") {
      return redirect(`${siteUrl()}/?checkout=error&reason=not-found`);
    }

    const checkoutUrl = await createCheckoutSession({
      name: product.title || "Scandi Japandi",
      amountMinor: Math.round(product.price * 100),
      curator,
      slug,
    });

    return redirect(checkoutUrl);
  } catch (err) {
    console.error("[checkout]", err instanceof Error ? err.message : err);
    return redirect(`${siteUrl()}/?checkout=error`);
  }
};

export const config = {
  path: "/api/checkout",
};
