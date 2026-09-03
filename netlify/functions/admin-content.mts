// 北の手 / Kita no Te — content episodes API (admin only).
//
// Episodes are the core unit of the media channel. Each episode links to a
// producer lead and to the products shown in it (episode_products).
//
// HARD RULE: an episode cannot be set to status 'published' unless
// native_qa_done is true. A Japanese native speaker must approve subtitles
// and voice before anything goes live. This gate is enforced here, not only
// in the admin UI.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { requireAdmin } from "../lib/require-admin.mts";

const STATUSES = new Set(["planned", "filmed", "in_localisation", "qa", "published", "archived"]);
const FORMATS = new Set(["atelier", "object", "material", "live", "season"]);

function slugify(input: string): string {
  return String(input || "")
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function withProducts(rows: any[]) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => Number(r.id));
  const links = await db.sql`
    SELECT episode_id, product_slug, sort_order FROM episode_products
    WHERE episode_id = ANY(${ids}::int[])
    ORDER BY sort_order ASC
  `;
  const map = new Map<number, string[]>();
  for (const l of links as any[]) {
    const arr = map.get(Number(l.episode_id)) || [];
    arr.push(l.product_slug);
    map.set(Number(l.episode_id), arr);
  }
  return rows.map((r) => ({ ...r, product_slugs: map.get(Number(r.id)) || [] }));
}

async function replaceProducts(episodeId: number, slugs: unknown) {
  await db.sql`DELETE FROM episode_products WHERE episode_id = ${episodeId}`;
  if (!Array.isArray(slugs)) return;
  let i = 0;
  for (const s of slugs) {
    const slug = String(s || "").trim();
    if (!slug) continue;
    await db.sql`
      INSERT INTO episode_products (episode_id, product_slug, sort_order)
      VALUES (${episodeId}, ${slug}, ${i++})
      ON CONFLICT DO NOTHING
    `;
  }
}

function clean(b: any) {
  const status = STATUSES.has(b.status) ? b.status : "planned";
  const format = FORMATS.has(b.format) ? b.format : "atelier";
  return {
    slug: slugify(b.slug || b.title_no || ""),
    title_no: String(b.title_no || "").trim(),
    title_en: b.title_en || null,
    title_jp: b.title_jp || null,
    format,
    producer_lead_id: b.producer_lead_id ? Number(b.producer_lead_id) : null,
    producer_name: b.producer_name || null,
    location: b.location || null,
    description_no: b.description_no || null,
    description_en: b.description_en || null,
    description_jp: b.description_jp || null,
    video_url_jp: b.video_url_jp || null,
    video_url_en: b.video_url_en || null,
    video_url_no: b.video_url_no || null,
    short_url: b.short_url || null,
    thumbnail_url: b.thumbnail_url || null,
    duration_seconds: b.duration_seconds != null && b.duration_seconds !== "" ? Number(b.duration_seconds) : null,
    status,
    native_qa_done: b.native_qa_done === true,
    filmed_at: b.filmed_at || null,
    co_host_influencer_id: b.co_host_influencer_id ? Number(b.co_host_influencer_id) : null,
    notes: b.notes || null,
  };
}

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  const isId = /^\d+$/.test(last);
  const isCollection = last === "content";
  if (!isId && !isCollection) return new Response("Not found", { status: 404 });

  try {
    if (req.method === "GET" && isCollection) {
      const rows = await db.sql`SELECT * FROM content_episodes ORDER BY created_at DESC LIMIT 200`;
      return Response.json({ episodes: await withProducts(rows as any[]) });
    }

    if (req.method === "GET" && isId) {
      const rows = await db.sql`SELECT * FROM content_episodes WHERE id = ${Number(last)} LIMIT 1`;
      if (!rows.length) return Response.json({ error: "not found" }, { status: 404 });
      const [ep] = await withProducts(rows as any[]);
      return Response.json({ episode: ep });
    }

    if (req.method === "POST" && isCollection) {
      const b = await req.json();
      const e = clean(b);
      if (!e.title_no) return Response.json({ error: "title_no is required" }, { status: 400 });
      if (!e.slug) return Response.json({ error: "slug could not be derived" }, { status: 400 });
      if (e.status === "published" && !e.native_qa_done) {
        return Response.json({ error: "native_qa_done required" }, { status: 400 });
      }
      const [row] = await db.sql`
        INSERT INTO content_episodes (
          slug, title_no, title_en, title_jp, format, producer_lead_id, producer_name, location,
          description_no, description_en, description_jp,
          video_url_jp, video_url_en, video_url_no, short_url, thumbnail_url, duration_seconds,
          status, native_qa_done, filmed_at, published_at, co_host_influencer_id, notes
        ) VALUES (
          ${e.slug}, ${e.title_no}, ${e.title_en}, ${e.title_jp}, ${e.format}, ${e.producer_lead_id}, ${e.producer_name}, ${e.location},
          ${e.description_no}, ${e.description_en}, ${e.description_jp},
          ${e.video_url_jp}, ${e.video_url_en}, ${e.video_url_no}, ${e.short_url}, ${e.thumbnail_url}, ${e.duration_seconds},
          ${e.status}, ${e.native_qa_done}, ${e.filmed_at},
          ${e.status === "published" ? new Date().toISOString() : null},
          ${e.co_host_influencer_id}, ${e.notes}
        ) RETURNING *
      `;
      await replaceProducts(Number((row as any).id), b.product_slugs);
      const [ep] = await withProducts([row]);
      return Response.json({ episode: ep }, { status: 201 });
    }

    if (req.method === "PUT" && isId) {
      const b = await req.json();
      const e = clean(b);
      if (!e.title_no) return Response.json({ error: "title_no is required" }, { status: 400 });
      if (e.status === "published" && !e.native_qa_done) {
        return Response.json({ error: "native_qa_done required" }, { status: 400 });
      }
      const [row] = await db.sql`
        UPDATE content_episodes SET
          slug = ${e.slug},
          title_no = ${e.title_no}, title_en = ${e.title_en}, title_jp = ${e.title_jp},
          format = ${e.format}, producer_lead_id = ${e.producer_lead_id}, producer_name = ${e.producer_name}, location = ${e.location},
          description_no = ${e.description_no}, description_en = ${e.description_en}, description_jp = ${e.description_jp},
          video_url_jp = ${e.video_url_jp}, video_url_en = ${e.video_url_en}, video_url_no = ${e.video_url_no},
          short_url = ${e.short_url}, thumbnail_url = ${e.thumbnail_url}, duration_seconds = ${e.duration_seconds},
          status = ${e.status}, native_qa_done = ${e.native_qa_done}, filmed_at = ${e.filmed_at},
          published_at = CASE WHEN ${e.status} = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END,
          co_host_influencer_id = ${e.co_host_influencer_id}, notes = ${e.notes},
          updated_at = NOW()
        WHERE id = ${Number(last)}
        RETURNING *
      `;
      if (!row) return Response.json({ error: "not found" }, { status: 404 });
      await replaceProducts(Number(last), b.product_slugs);
      const [ep] = await withProducts([row]);
      return Response.json({ episode: ep });
    }

    if (req.method === "DELETE" && isId) {
      await db.sql`DELETE FROM content_episodes WHERE id = ${Number(last)}`;
      return new Response(null, { status: 204 });
    }

    return new Response("Not found", { status: 404 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin-content]", msg);
    if (/duplicate key|unique/i.test(msg)) {
      return Response.json({ error: "slug already exists" }, { status: 409 });
    }
    return Response.json({ error: "request failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: ["/api/admin/content", "/api/admin/content/:id"],
};
