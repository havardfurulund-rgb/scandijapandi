// Public products feed for the storefront. Returns the active collection as
// JSON so the (statically built) front page can hydrate its grid with whatever
// is currently published from the admin — no rebuild required when products
// change.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";

export default async (_req: Request) => {
  try {
    const rows = await db.sql`
      SELECT slug, name, producer, description, price_nok, image_url
      FROM products
      WHERE active = TRUE
      ORDER BY created_at DESC, id DESC
    `;

    const products = rows.map((r: any) => ({
      slug: r.slug,
      name: r.name,
      producer: r.producer,
      description: r.description,
      price: Number(r.price_nok),
      image: r.image_url,
    }));

    return Response.json(
      { products },
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
