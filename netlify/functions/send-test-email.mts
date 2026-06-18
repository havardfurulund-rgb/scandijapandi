// Diagnostic endpoint for confirming the Gmail email integration works end to
// end. POST a JSON body of { "recipientEmail": "you@example.com" } and a test
// message is delivered through the same shared sendEmail() helper that the
// Stripe webhook uses — so a success here means real order mail will flow too.
//
//   curl -X POST /api/send-test-email -d '{"recipientEmail":"you@example.com"}'
//
// A GET request returns only whether the required environment variables are
// configured (booleans, never the values), so the admin panel can show a
// "keys are set" status indicator.
//
// The POST response surfaces a clear, human-readable Norwegian error so the
// admin knows exactly what went wrong:
//   200 { ok: true,  message: "Test-e-post sendt!" }
//   400 { ok: false, error: "Mangler Gmail-oppsett …" } — GMAIL_* not set
//   502 { ok: false, error: "Gmail avviste innlogging …" } — bad credentials
//   502 { ok: false, error: "E-postfeil: …" }            — any other send error
import type { Config, Context } from "@netlify/functions";
import { sendEmail } from "../lib/send-email.mts";

// Maps a raw sendEmail() failure into a clear Norwegian message. nodemailer
// reports bad Gmail credentials with an "Invalid login" / SMTP 535 error.
function describeError(reason: string): string {
  if (/invalid login|535|EAUTH|Username and Password not accepted/i.test(reason)) {
    return "Gmail avviste innlogging – sjekk GMAIL_USER og at GMAIL_APP_PASSWORD er et gyldig app-passord (ikke vanlig passord).";
  }
  if (/ENOTFOUND|ETIMEDOUT|ECONNECTION|ESOCKET/i.test(reason)) {
    return "Får ikke kontakt med Gmail-serveren – prøv igjen om litt.";
  }
  return `E-postfeil: ${reason}`;
}

export default async (req: Request, _context: Context) => {
  // GET → report configuration status only (booleans, never the secret values).
  if (req.method === "GET") {
    return Response.json({
      gmailUser: Boolean(Netlify.env.get("GMAIL_USER")),
      gmailAppPassword: Boolean(Netlify.env.get("GMAIL_APP_PASSWORD")),
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Wrap the whole POST flow so any unexpected throw still returns structured
  // JSON ({ ok, error }) instead of a 500 HTML page.
  try {
    // Fail fast with a clear message when the credentials are missing, rather
    // than letting sendEmail() silently "skip".
    if (!Netlify.env.get("GMAIL_USER") || !Netlify.env.get("GMAIL_APP_PASSWORD")) {
      return Response.json(
        { ok: false, error: "Mangler Gmail-oppsett – sett GMAIL_USER og GMAIL_APP_PASSWORD i Netlify Environment Variables." },
        { status: 400 },
      );
    }

    // The recipient is optional — fall back to sending to the Gmail account
    // itself so the endpoint is callable with an empty body.
    let recipientEmail = Netlify.env.get("GMAIL_USER") || "";
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.recipientEmail) recipientEmail = String(body.recipientEmail);
    } catch {
      // Empty/invalid body is fine; keep the default recipient.
    }

    const result = await sendEmail({
      to: recipientEmail,
      subject: "Test-e-post fra ScandiJapandi",
      html: `<h1>Dette er en test-e-post!</h1><p>Hvis du kan lese denne, fungerer e-postoppsettet (Gmail).</p>`,
      text: "Dette er en test-e-post! Hvis du kan lese denne, fungerer e-postoppsettet (Gmail).",
    });

    if (result.status === "error") {
      console.error("[send-test-email]", result.reason);
      return Response.json({ ok: false, error: describeError(result.reason) }, { status: 502 });
    }

    // "skipped" should not happen here (we checked the credentials above), but
    // guard anyway so the admin never sees a false "sent" when nothing went out.
    if (result.status === "skipped") {
      return Response.json(
        { ok: false, error: "Mangler Gmail-oppsett – e-posten ble ikke sendt." },
        { status: 400 },
      );
    }

    console.log(`[send-test-email] sent → ${recipientEmail}`);
    return Response.json({ ok: true, message: "Test-e-post sendt!", recipient: recipientEmail });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[send-test-email] uventet feil", reason);
    return Response.json(
      { ok: false, error: `Uventet feil ved sending: ${reason}` },
      { status: 500 },
    );
  }
};

export const config: Config = {
  path: "/api/send-test-email",
};
