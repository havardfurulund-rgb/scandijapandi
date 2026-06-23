// Test-e-post fra admin – sender en ekte e-post via Resend til en oppgitt
// adresse, slik at butikkeieren kan bekrefte at utgående e-post faktisk
// leveres (samme vei som kundekvittering og produsentvarsel går).
//
// Gated bak samme admin-autorisering som resten av /api/admin/*.
import type { Config } from "@netlify/functions";
import { requireAdmin } from "../lib/require-admin.mts";
import { sendEmail, emailConfigured, testEmail, defaultFrom } from "../lib/email.mts";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  // GET → fortell UI-et om e-post er konfigurert, og hvilken avsender som brukes.
  if (req.method === "GET") {
    return Response.json({ configured: emailConfigured(), from: defaultFrom() });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let to = "";
  try {
    const body = await req.json();
    to = String(body?.email || "").trim();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  if (!isValidEmail(to)) {
    return Response.json({ error: "Oppgi en gyldig e-postadresse." }, { status: 400 });
  }
  if (!emailConfigured()) {
    return Response.json(
      { error: "Utgående e-post er ikke konfigurert (RESEND_API_KEY mangler)." },
      { status: 503 },
    );
  }

  const mail = testEmail(to);
  const result = await sendEmail({ to, subject: mail.subject, html: mail.html, text: mail.text });
  if (!result.ok) {
    return Response.json({ error: result.reason || "Sending feilet." }, { status: 502 });
  }
  return Response.json({ ok: true, id: result.id, from: defaultFrom() });
};

export const config: Config = {
  path: "/api/admin/test-email",
};
