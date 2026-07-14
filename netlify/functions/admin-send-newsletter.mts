// Sends a newsletter campaign via Resend Broadcasts API.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { requireAdmin } from "../lib/require-admin.mts";

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { id } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const apiKey = Netlify.env.get("RESEND_API_KEY");
  if (!apiKey) return Response.json({ error: "RESEND_API_KEY not set" }, { status: 500 });

  const rows = await db.sql`SELECT * FROM newsletters WHERE id = ${id} LIMIT 1`;
  const nl = rows[0] as any;
  if (!nl) return Response.json({ error: "Newsletter not found" }, { status: 404 });

  // Get recipients from circle_leads based on segment
  const leads = nl.segment === 'all'
    ? await db.sql`SELECT email, language FROM circle_leads`
    : await db.sql`SELECT email, language FROM circle_leads WHERE segment = ${nl.segment}`;

  if (!leads.length) return Response.json({ error: "No recipients" }, { status: 400 });

  // Create Resend broadcast
  const res = await fetch("https://api.resend.com/broadcasts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audience_id: Netlify.env.get("RESEND_AUDIENCE_ID"),
      from: Netlify.env.get("EMAIL_FROM") || "ScandiJapandi <ordre@scandijapandi.no>",
      subject: nl.subject_en || nl.subject_no || "ScandiJapandi",
      html: nl.body_en || nl.body_no || "",
      name: `Newsletter ${nl.id} — ${new Date().toISOString().slice(0,10)}`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[send-newsletter] Resend error:", err);
    return Response.json({ error: "Resend API failed", detail: err }, { status: 502 });
  }

  const data = await res.json();
  const broadcastId = data.id;

  // Send the broadcast
  await fetch(`https://api.resend.com/broadcasts/${broadcastId}/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  // Update DB
  await db.sql`
    UPDATE newsletters SET
      status = 'sent',
      sent_at = NOW(),
      recipients = ${leads.length},
      resend_broadcast_id = ${broadcastId}
    WHERE id = ${id}
  `;

  return Response.json({ ok: true, broadcastId, recipients: leads.length });
};

export const config: Config = {
  path: "/api/admin/kurator/send-newsletter",
};
