// Kurator hub API — handles newsletter, press, influencer, and producer data.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { requireAdmin } from "../lib/require-admin.mts";

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const resource = parts[parts.length - 1] || "";

  try {
    // ── GET handlers ──────────────────────────────────────────────────
    if (req.method === "GET") {

      if (resource === "newsletters") {
        const rows = await db.sql`SELECT * FROM newsletters ORDER BY created_at DESC LIMIT 50`;
        return Response.json({ newsletters: rows });
      }

      if (resource === "press") {
        const releases = await db.sql`SELECT * FROM press_releases ORDER BY created_at DESC LIMIT 50`;
        const contacts = await db.sql`SELECT * FROM press_contacts WHERE active = TRUE ORDER BY outlet`;
        return Response.json({ releases, contacts });
      }

      if (resource === "influencers") {
        // amount_total is stored as TEXT (Stripe minor units), so it must be
        // cast to numeric before SUM — a bare SUM(text) errors in Postgres.
        const rows = await db.sql`
          SELECT i.*,
            COUNT(o.id) as order_count,
            COALESCE(SUM(NULLIF(o.amount_total, '')::numeric), 0) as total_revenue
          FROM influencers i
          LEFT JOIN orders o ON o.curator = i.ref_code
          GROUP BY i.id
          ORDER BY i.status, i.created_at DESC
        `;
        return Response.json({ influencers: rows });
      }

      if (resource === "producers") {
        const rows = await db.sql`
          SELECT
            p.producer,
            p.producer_email,
            COUNT(DISTINCT p.slug) as product_count,
            COUNT(o.id) as order_count,
            COALESCE(SUM(NULLIF(o.amount_total, '')::numeric), 0) as total_revenue_minor
          FROM products p
          LEFT JOIN orders o ON o.items::text LIKE '%' || p.slug || '%'
          WHERE p.producer_email IS NOT NULL
          GROUP BY p.producer, p.producer_email
          ORDER BY p.producer
        `;
        return Response.json({ producers: rows });
      }
    }

    // ── POST handlers ─────────────────────────────────────────────────
    if (req.method === "POST") {
      const body = await req.json();

      if (resource === "newsletters") {
        const [row] = await db.sql`
          INSERT INTO newsletters (subject_no, subject_en, subject_jp, body_no, body_en, body_jp, segment)
          VALUES (${body.subject_no||null}, ${body.subject_en||null}, ${body.subject_jp||null},
                  ${body.body_no||null}, ${body.body_en||null}, ${body.body_jp||null},
                  ${body.segment||'all'})
          RETURNING *
        `;
        return Response.json({ newsletter: row }, { status: 201 });
      }

      if (resource === "press-contacts") {
        const [row] = await db.sql`
          INSERT INTO press_contacts (name, outlet, email, country, language, notes)
          VALUES (${body.name}, ${body.outlet||null}, ${body.email}, ${body.country||null}, ${body.language||'en'}, ${body.notes||null})
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name, outlet = EXCLUDED.outlet,
            country = EXCLUDED.country, notes = EXCLUDED.notes
          RETURNING *
        `;
        return Response.json({ contact: row }, { status: 201 });
      }

      if (resource === "press-releases") {
        const [row] = await db.sql`
          INSERT INTO press_releases (title, title_en, title_jp, body_no, body_en, body_jp)
          VALUES (${body.title}, ${body.title_en||null}, ${body.title_jp||null},
                  ${body.body_no||null}, ${body.body_en||null}, ${body.body_jp||null})
          RETURNING *
        `;
        return Response.json({ release: row }, { status: 201 });
      }

      if (resource === "influencers") {
        const [row] = await db.sql`
          INSERT INTO influencers (name, handle, platform, email, ref_code, country, language, status, commission_pct, notes)
          VALUES (${body.name}, ${body.handle||null}, ${body.platform||null}, ${body.email||null},
                  ${body.ref_code||null}, ${body.country||'JP'}, ${body.language||'ja'},
                  ${body.status||'prospect'}, ${body.commission_pct||10}, ${body.notes||null})
          ON CONFLICT (ref_code) DO UPDATE SET
            name = EXCLUDED.name, handle = EXCLUDED.handle,
            platform = EXCLUDED.platform, email = EXCLUDED.email,
            status = EXCLUDED.status, notes = EXCLUDED.notes
          RETURNING *
        `;
        return Response.json({ influencer: row }, { status: 201 });
      }
    }

    // ── DELETE handlers ───────────────────────────────────────────────
    // Path shape: /api/admin/kurator/press-contacts/:id
    if (req.method === "DELETE") {
      const id = Number(parts[parts.length - 1]);
      const collection = parts[parts.length - 2];
      if (collection === "press-contacts" && Number.isInteger(id)) {
        await db.sql`DELETE FROM press_contacts WHERE id = ${id}`;
        return Response.json({ ok: true });
      }
    }

    return new Response("Not found", { status: 404 });
  } catch (err) {
    console.error("[admin-kurator]", err instanceof Error ? err.message : err);
    return Response.json({ error: "request failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: [
    "/api/admin/kurator/newsletters",
    "/api/admin/kurator/press",
    "/api/admin/kurator/press-contacts",
    "/api/admin/kurator/press-contacts/:id",
    "/api/admin/kurator/press-releases",
    "/api/admin/kurator/influencers",
    "/api/admin/kurator/producers",
  ],
};
