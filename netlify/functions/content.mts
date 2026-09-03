// 北の手 / Kita no Te — public stories API.
//
//   GET /api/stories         → published episodes (list)
//   GET /api/stories/:slug   → one published episode + the products shown in it
//
// Never breaks the storefront: on any error the list returns { episodes: [] }
// and the detail endpoint returns 404.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";

const CACHE = { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" };

export default async (req: Request) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  const isList = last === "stories";

  try {
    if (isList) {
      const rows = await db.sql`
        SELECT slug, title_no, title_en, title_jp, format, producer_name, location,
               thumbnail_url, short_url, duration_seconds, published_at
        FROM content_episodes
        WHERE status = 'published'
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT 100
      `;
      return Response.json({ episodes: rows }, { headers: CACHE });
    }

    const slug = decodeURIComponent(last);
    const rows = await db.sql`
      SELECT id, slug, title_no, title_en, title_jp, format, producer_name, producer_lead_id, location,
             description_no, description_en, description_jp,
             video_url_jp, video_url_en, video_url_no, short_url, thumbnail_url,
             duration_seconds, published_at, filmed_at
      FROM content_episodes
      WHERE slug = ${slug} AND status = 'published'
      LIMIT 1
    `;
    if (!rows.length) return Response.json({ error: "not found" }, { status: 404 });
    const ep = rows[0] as any;

    const products = await db.sql`
      SELECT p.slug, p.name, p.name_en, p.name_jp, p.price_nok, p.price_jpy, p.image_url, p.producer
      FROM episode_products e
      JOIN products p ON p.slug = e.product_slug
      WHERE e.episode_id = ${Number(ep.id)} AND p.active = TRUE
      ORDER BY e.sort_order ASC
    `;

    // Producer image/story, when the episode is linked to a CRM lead that has a
    // matching product producer — optional enrichment, never required.
    const { id, producer_lead_id, ...pub } = ep;
    return Response.json({ episode: { ...pub, products } }, { headers: CACHE });
  } catch (err) {
    console.error("[content]", err instanceof Error ? err.message : err);
    if (isList) return Response.json({ episodes: [] }, { status: 200 });
    return Response.json({ error: "unavailable" }, { status: 404 });
  }
};

export const config: Config = {
  path: ["/api/stories", "/api/stories/:slug"],
};
