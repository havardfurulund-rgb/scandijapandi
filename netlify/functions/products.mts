// Public products feed for the storefront. Returns the active collection as
// JSON so the (statically built) front page can hydrate its grid with whatever
// is currently published from the admin — no rebuild required when products
// change.
//
// Optional filter: /api/products?brand=<brand_slug> (used by the maker pages).
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { displayJpy, jpyRate } from "../lib/currency.mts";

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const brand = (url.searchParams.get("brand") || "").trim();

    const rows = brand
      ? await db.sql`
          SELECT slug, name, producer, description, price_nok, price_jpy, image_url, stock_quantity,
                 product_type, price_from, brand_slug, one_of_a_kind
          FROM products
          WHERE active = TRUE AND brand_slug = ${brand}
          ORDER BY price_nok DESC, id DESC
        `
      : await db.sql`
          SELECT slug, name, producer, description, price_nok, price_jpy, image_url, stock_quantity,
                 product_type, price_from, brand_slug, one_of_a_kind
          FROM products
          WHERE active = TRUE
          ORDER BY created_at DESC, id DESC
        `;

    const products = rows.map((r: any) => {
      const price = Number(r.price_nok);
      const madeToMeasure = r.product_type === "made_to_measure";
      return {
        slug: r.slug,
        name: r.name,
        producer: r.producer,
        brand_slug: r.brand_slug || null,
        description: r.description,
        price,
        price_jpy: displayJpy(price, r.price_jpy ? Number(r.price_jpy) : null),
        price_from: Boolean(r.price_from),
        product_type: r.product_type || "product",
        one_of_a_kind: Boolean(r.one_of_a_kind),
        image: r.image_url,
        // A null/absent quantity means stock isn't tracked for this product, so
        // treat it as available; only an explicit 0 (or less) marks it sold out.
        // Made-to-measure listings are never "sold out".
        in_stock: madeToMeasure || r.stock_quantity === null || r.stock_quantity === undefined || Number(r.stock_quantity) > 0,
        product_page: `/products/${r.slug}`,
      };
    });

    return Response.json(
      { products, jpy_per_nok: jpyRate() },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (err) {
    console.error("[products]", err instanceof Error ? err.message : err);
    // Never break the storefront: signal an empty result so the page can fall
    // back to its embedded launch collection.
    return Response.json({ products: [], error: "unavailable" }, { status: 200 });
  }
};

export const config: Config = {
  path: "/api/products",
};
