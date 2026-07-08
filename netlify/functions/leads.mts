// Stores leads (email signups) with segment and source data.
// Called from the homepage circle form after segment selection.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }

  try {
    await db.sql`
      INSERT INTO circle_leads (
        email, segment, language, ref_code, source, created_at
      ) VALUES (
        ${email},
        ${body.segment || 'unknown'},
        ${body.language || 'no'},
        ${body.ref_code || null},
        ${body.source || 'homepage'},
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        segment = EXCLUDED.segment,
        language = EXCLUDED.language,
        ref_code = COALESCE(EXCLUDED.ref_code, circle_leads.ref_code),
        updated_at = NOW()
    `;
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[leads]", err instanceof Error ? err.message : err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/leads",
};
