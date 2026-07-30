// Producer CRM API — manages producer leads pipeline
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { requireAdmin } from "../lib/require-admin.mts";

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  // `/api/admin/crm` addresses the collection, `/api/admin/crm/42` a single lead.
  // Anything else (e.g. the sibling `/api/admin/crm/research` endpoint) is not
  // ours to handle — never treat it as a collection request.
  const isId = /^\d+$/.test(last);
  const isCollection = last === "crm";
  if (!isId && !isCollection) return new Response("Not found", { status: 404 });

  try {
    // GET all leads
    if (req.method === "GET" && isCollection) {
      const status = url.searchParams.get("status");
      const priority = url.searchParams.get("priority");
      const country = url.searchParams.get("country");
      const search = url.searchParams.get("search");

      let rows;
      if (status || priority || country || search) {
        // Every parameter is explicitly cast: Postgres cannot infer the type of
        // a bare placeholder used in `$1 IS NULL`, and errors out without it.
        rows = await db.sql`
          SELECT * FROM producer_leads
          WHERE
            (${status}::text IS NULL OR status = ${status}::text)
            AND (${priority}::int IS NULL OR priority = ${priority}::int)
            AND (${country}::text IS NULL OR country ILIKE ${country}::text)
            AND (${search}::text IS NULL OR
              name ILIKE ${'%' + (search || '') + '%'}::text OR
              category ILIKE ${'%' + (search || '') + '%'}::text OR
              notes ILIKE ${'%' + (search || '') + '%'}::text
            )
          ORDER BY priority ASC, japandi_score DESC, created_at DESC
        `;
      } else {
        rows = await db.sql`
          SELECT * FROM producer_leads
          ORDER BY priority ASC, japandi_score DESC, created_at DESC
        `;
      }

      // Summary stats — always over the whole table, not the filtered slice.
      const all = await db.sql`
        SELECT status, COUNT(*) as count FROM producer_leads GROUP BY status
      `;

      return Response.json({ leads: rows, summary: all });
    }

    // GET single lead
    if (req.method === "GET" && isId) {
      const rows = await db.sql`SELECT * FROM producer_leads WHERE id = ${Number(last)} LIMIT 1`;
      if (!rows.length) return Response.json({ error: "not found" }, { status: 404 });
      return Response.json({ lead: rows[0] });
    }

    // POST — create new lead
    if (req.method === "POST" && isCollection) {
      const b = await req.json();
      if (!b?.name) return Response.json({ error: "name is required" }, { status: 400 });
      const [row] = await db.sql`
        INSERT INTO producer_leads (
          name, country, region, category, main_products,
          website, instagram, contact_email, contact_name,
          japandi_score, japandi_notes, priority, status,
          fits_japandi, outreach_channel, notes, next_action,
          next_action_date, ai_summary, source
        ) VALUES (
          ${b.name}, ${b.country || null}, ${b.region || null},
          ${b.category || null}, ${b.main_products || null},
          ${b.website || null}, ${b.instagram || null},
          ${b.contact_email || null}, ${b.contact_name || null},
          ${b.japandi_score || 3}, ${b.japandi_notes || null},
          ${b.priority || 2}, ${b.status || 'prospect'},
          ${b.fits_japandi || 'yes'}, ${b.outreach_channel || null},
          ${b.notes || null}, ${b.next_action || null},
          ${b.next_action_date || null}, ${b.ai_summary || null},
          ${'manual'}
        ) RETURNING *
      `;
      return Response.json({ lead: row }, { status: 201 });
    }

    // PUT — update lead
    if (req.method === "PUT" && isId) {
      const b = await req.json();
      const [row] = await db.sql`
        UPDATE producer_leads SET
          name = COALESCE(${b.name || null}, name),
          country = ${b.country ?? null},
          region = ${b.region ?? null},
          category = ${b.category ?? null},
          main_products = ${b.main_products ?? null},
          website = ${b.website ?? null},
          instagram = ${b.instagram ?? null},
          contact_email = ${b.contact_email ?? null},
          contact_name = ${b.contact_name ?? null},
          japandi_score = COALESCE(${b.japandi_score ?? null}, japandi_score),
          japandi_notes = ${b.japandi_notes ?? null},
          priority = COALESCE(${b.priority ?? null}, priority),
          status = COALESCE(${b.status || null}, status),
          fits_japandi = ${b.fits_japandi ?? null},
          outreach_channel = ${b.outreach_channel ?? null},
          notes = ${b.notes ?? null},
          last_contacted = ${b.last_contacted ?? null},
          next_action = ${b.next_action ?? null},
          next_action_date = ${b.next_action_date ?? null},
          ai_summary = ${b.ai_summary ?? null},
          updated_at = NOW()
        WHERE id = ${Number(last)}
        RETURNING *
      `;
      if (!row) return Response.json({ error: "not found" }, { status: 404 });
      return Response.json({ lead: row });
    }

    // DELETE
    if (req.method === "DELETE" && isId) {
      await db.sql`DELETE FROM producer_leads WHERE id = ${Number(last)}`;
      return new Response(null, { status: 204 });
    }

    return new Response("Not found", { status: 404 });
  } catch (err) {
    console.error("[admin-producer-crm]", err instanceof Error ? err.message : err);
    return Response.json({ error: "request failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: ["/api/admin/crm", "/api/admin/crm/:id"],
  excludedPath: "/api/admin/crm/research",
};
