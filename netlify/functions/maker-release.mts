// 北の手 / Kita no Te — maker release agreement.
//
//   POST /api/maker-release   → stores the signed agreement, emails a copy to the
//                               maker and to SHOP_EMAIL. Called by /release/[lang].
//   GET  /api/maker-release?email=…  (admin only) → latest release for an email
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { sendEmail } from "../lib/email.mts";
import { requireAdmin } from "../lib/require-admin.mts";

const TEXT = {
  no: `[NAVN] gir SKM Nordic AS (Scandi Japandi Collection / Kita no Te) rett til å ta opp, redigere, oversette (inkludert syntetisk stemme på japansk basert på egen stemme) og publisere video, lyd og foto fra [DATO/STED] i alle kanaler, uten tidsbegrensning, for markedsføring av [NAVN]s produkter og Kita no Te. [NAVN] beholder alle rettigheter til egne produkter og kan bruke publisert innhold fritt selv. Ingen vederlag for opptaket; provisjon ved salg følger egen avtale. [NAVN] kan kreve at et klipp fjernes ved saklig grunn.`,
  en: `[NAME] grants SKM Nordic AS (Scandi Japandi Collection / Kita no Te) the right to record, edit, translate (including a synthetic Japanese voice based on [NAME]'s own voice), and publish video, audio and photographs from [DATE/PLACE] in all channels, without time limit, to promote [NAME]'s work and Kita no Te. [NAME] retains all rights to their products and may freely reuse published content. No fee for the recording; sales commission follows a separate agreement. [NAME] may request removal of a clip for reasonable cause.`,
};

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export default async (req: Request) => {
  if (req.method === "GET") {
    const denied = await requireAdmin(req);
    if (denied) return denied;
    const email = (new URL(req.url).searchParams.get("email") || "").trim().toLowerCase();
    if (!email) return Response.json({ release: null });
    const rows = await db.sql`SELECT id, maker_name, company, email, shoot_date, shoot_place, language, created_at FROM maker_releases WHERE email = ${email} ORDER BY created_at DESC LIMIT 1`;
    return Response.json({ release: rows[0] || null });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let b: any;
  try { b = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const makerName = String(b.maker_name || "").trim();
  const email = String(b.email || "").trim().toLowerCase();
  const signature = String(b.signature_text || "").trim();
  const lang = b.language === "en" ? "en" : "no";
  if (!makerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !signature || b.agreed !== true) {
    return Response.json({ error: "name, valid email, signature and agreement are required" }, { status: 400 });
  }

  const ip = req.headers.get("x-nf-client-connection-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
  const ua = req.headers.get("user-agent") || null;

  const [row] = await db.sql`
    INSERT INTO maker_releases (maker_name, company, email, shoot_date, shoot_place, language, signature_text, agreed, ip, user_agent)
    VALUES (${makerName}, ${b.company || null}, ${email}, ${b.shoot_date || null}, ${b.shoot_place || null}, ${lang}, ${signature}, TRUE, ${ip}, ${ua})
    RETURNING id, created_at
  `;

  const when = `${b.shoot_date || "—"} / ${b.shoot_place || "—"}`;
  const bodyText = TEXT[lang].replace(/\[NAVN\]|\[NAME\]/g, makerName).replace(/\[DATO\/STED\]|\[DATE\/PLACE\]/g, when);
  const subject = lang === "en" ? `Signed: Kita no Te recording agreement — ${makerName}` : `Signert: Kita no Te opptaksavtale — ${makerName}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#ECE7DB;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ECE7DB;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#F4F1EA;border:1px solid rgba(42,39,35,0.08);">
<tr><td style="padding:28px 36px 8px;border-bottom:1px solid rgba(42,39,35,0.08);font-family:Georgia,serif;font-size:20px;color:#2A2723;">北の手 · Kita no Te</td></tr>
<tr><td style="padding:32px 36px;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#2A2723;">
<p style="margin:0 0 16px;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#6F6A5F;">${lang === "en" ? "Recording agreement" : "Opptaksavtale"}</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.7;">${esc(bodyText)}</p>
<table style="font-size:13px;color:#2A2723;"><tr><td style="padding:4px 16px 4px 0;color:#6F6A5F;">${lang === "en" ? "Signed by" : "Signert av"}</td><td>${esc(signature)}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#6F6A5F;">${lang === "en" ? "Company" : "Virksomhet"}</td><td>${esc(b.company || "—")}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#6F6A5F;">E-post</td><td>${esc(email)}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#6F6A5F;">${lang === "en" ? "Date/place" : "Dato/sted"}</td><td>${esc(when)}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#6F6A5F;">ID</td><td>#${row.id} · ${new Date(row.created_at).toISOString()}</td></tr></table>
</td></tr>
<tr><td style="padding:20px 36px;border-top:1px solid rgba(42,39,35,0.08);font-size:11px;color:#6F6A5F;">Scandi Japandi Collection · SKM Nordic AS · org.nr. 927 215 063 · Lågendalsveien 1732A, 3282 Kvelde, Norway</td></tr>
</table></td></tr></table></body></html>`;

  const shop = Netlify.env.get("SHOP_EMAIL") || "hei@skmnordic.com";
  await Promise.allSettled([
    sendEmail({ to: email, subject, html, text: bodyText }),
    sendEmail({ to: shop, subject: `[avtale] ${subject}`, html, text: bodyText, replyTo: email }),
  ]);

  return Response.json({ ok: true, id: row.id }, { status: 201 });
};

export const config: Config = {
  path: "/api/maker-release",
};
