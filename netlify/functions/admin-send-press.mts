// Sends a press release to the full active press-contact list via Resend.
// Powers the "Send til presseliste" button in the Kurator hub. Additive and
// admin-gated; reuses the shared sendEmail path (netlify/lib/email.mts).
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { sendEmail } from "../lib/email.mts";
import { requireAdmin } from "../lib/require-admin.mts";

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { id } = await req.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  try {
    const rows = await db.sql`SELECT * FROM press_releases WHERE id = ${id} LIMIT 1`;
    const rel = (rows as any[])[0];
    if (!rel) return Response.json({ error: "Press release not found" }, { status: 404 });

    const contacts = await db.sql`SELECT email FROM press_contacts WHERE active = TRUE`;
    const emails = (contacts as any[]).map((c) => c.email).filter(Boolean);
    if (!emails.length) return Response.json({ error: "No press contacts" }, { status: 400 });

    // Prefer English for the international press list, fall back to Norwegian.
    const subject = rel.title_en || rel.title || "ScandiJapandi";
    const bodyText = rel.body_en || rel.body_no || rel.body_jp || "";
    const html = `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ECE7DB;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ECE7DB;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#F4F1EA;border:1px solid rgba(42,39,35,0.08);">
        <tr><td style="padding:28px 36px 8px;border-bottom:1px solid rgba(42,39,35,0.08);">
          <div style="font-family:Georgia,serif;font-size:20px;color:#2A2723;">ScandiJapandi</div>
          <div style="font-size:11px;color:#6F6A5F;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;">Press release</div>
        </td></tr>
        <tr><td style="padding:32px 36px;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#2A2723;">
          <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:24px;font-weight:normal;color:#2A2723;">${subject}</h1>
          <div style="font-size:14px;line-height:1.7;color:#2A2723;">${bodyText}</div>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid rgba(42,39,35,0.08);font-size:11px;color:#6F6A5F;">
          ScandiJapandi · Nordisk håndverk for verden
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    // Send individually so each recipient only sees their own address.
    let sent = 0;
    for (const to of emails) {
      const result = await sendEmail({
        to,
        subject,
        html,
        text: bodyText.replace(/<[^>]+>/g, ""),
        replyTo: Netlify.env.get("SHOP_EMAIL") || undefined,
      });
      if (result.ok) sent++;
    }

    if (!sent) return Response.json({ error: "E-post feilet — sjekk RESEND_API_KEY" }, { status: 502 });

    await db.sql`
      UPDATE press_releases SET status = 'sent', sent_at = NOW(), recipients = ${sent} WHERE id = ${id}
    `;

    return Response.json({ ok: true, recipients: sent });
  } catch (err) {
    console.error("[admin-send-press]", err instanceof Error ? err.message : err);
    return Response.json({ error: "request failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/admin/kurator/send-press",
};
