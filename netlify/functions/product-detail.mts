// Single product detail endpoint for /products/[slug] pages.
// Returns full product data including producer story and gallery.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";

export default async (req: Request) => {
  const url = new URL(req.url);
  const slug = url.pathname.split("/").pop() || "";

  if (!slug) {
    return Response.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const rows = await db.sql`
      SELECT
        slug, name, name_en, name_jp,
        producer, producer_story, producer_location, producer_image_url,
        description, description_en, description_jp,
        origin_story, origin_story_en, origin_story_jp,
        producer_story_en, producer_story_jp,
        material, material_en, material_jp,
        dimensions,
        care_instructions, care_instructions_en, care_instructions_jp,
        price_nok, price_jpy,
        image_url, gallery_urls,
        active, created_at
      FROM products
      WHERE slug = ${slug} AND active = TRUE
      LIMIT 1
    `;

    if (!rows.length) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const r = rows[0] as any;
    const product = {
      slug: r.slug,
      name: r.name,
      name_en: r.name_en || r.name,
      name_jp: r.name_jp || r.name,
      producer: r.producer,
      producer_story: r.producer_story || null,
      producer_location: r.producer_location || null,
      producer_image_url: r.producer_image_url || null,
      description: r.description || null,
      description_en: r.description_en || null,
      description_jp: r.description_jp || null,
      origin_story: r.origin_story || null,
      origin_story_en: r.origin_story_en || null,
      origin_story_jp: r.origin_story_jp || null,
      producer_story_en: r.producer_story_en || null,
      producer_story_jp: r.producer_story_jp || null,
      material_en: r.material_en || null,
      material_jp: r.material_jp || null,
      care_instructions_en: r.care_instructions_en || null,
      care_instructions_jp: r.care_instructions_jp || null,
      material: r.material || null,
      dimensions: r.dimensions || null,
      care_instructions: r.care_instructions || null,
      price_nok: Number(r.price_nok),
      price_jpy: r.price_jpy ? Number(r.price_jpy) : null,
      image_url: r.image_url,
      gallery_urls: Array.isArray(r.gallery_urls) ? r.gallery_urls : [],
      created_at: r.created_at,
    };

    return Response.json(
      { product },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (err) {
    console.error("[product-detail]", err instanceof Error ? err.message : err);
    return Response.json({ error: "unavailable" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/products/:slug",
};
