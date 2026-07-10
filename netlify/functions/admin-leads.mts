// Admin leads overview — shows Private Circle signups with segment and source.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { requireAdmin } from "../lib/require-admin.mts";

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rows = await db.sql`
      SELECT email, segment, language, ref_code, source, created_at, updated_at
      FROM circle_leads
      ORDER BY created_at DESC
      LIMIT 500
    `;

    const summary = {
      total: rows.length,
      customers: rows.filter((r: any) => r.segment === 'customer').length,
      makers: rows.filter((r: any) => r.segment === 'maker').length,
      curators: rows.filter((r: any) => r.segment === 'curator').length,
      pending: rows.filter((r: any) => r.segment === 'pending' || !r.segment).length,
    };

    return Response.json({ leads: rows, summary });
  } catch (err) {
    console.error("[admin-leads]", err instanceof Error ? err.message : err);
    return Response.json({ error: "request failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/admin/leads",
};
