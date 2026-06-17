// Diagnostic endpoint for confirming the Resend email integration works end to
// end. POST a JSON body of { "recipientEmail": "you@example.com" } and a test
// message is delivered through the same shared sendEmail() helper that checkout
// and the Stripe webhook use — so a success here means real order mail will
// flow too.
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
//   400 { ok: false, error: "Mangler API-nøkkel …" }   — RESEND_API_KEY missing
//   502 { ok: false, error: "Ugyldig API-nøkkel …" }   — Resend rejected the key
//   502 { ok: false, error: "Ugyldig avsender …" }     — bad ORDER_FROM_EMAIL
//   502 { ok: false, error: "Resend-feil: …" }         — any other Resend error
import type { Config, Context } from "@netlify/functions";
import { sendEmail } from "../lib/send-email.mts";

// Maps a raw sendEmail() failure into a clear Norwegian message. The shared
// helper reports Resend errors as "Resend responded <status>: <detail>", so we
// inspect the status code to tell key problems from sender problems.
function describeError(reason: string): string {
  const match = reason.match(/Resend responded (\d+)/);
  const httpStatus = match ? Number(match[1]) : null;

  if (httpStatus === 401 || httpStatus === 403) {
    return "Ugyldig API-nøkkel – RESEND_API_KEY ble avvist av Resend.";
  }
  if (httpStatus === 422) {
    // Resend returns 422 for an unverified / malformed "from" address.
    return "Ugyldig avsender – sjekk at ORDER_FROM_EMAIL er en verifisert adresse i Resend.";
  }
  if (httpStatus === 429) {
    return "For mange forespørsler mot Resend – vent litt og prøv igjen.";
  }
  return `Resend-feil: ${reason}`;
}

export default async (req: Request, _context: Context) => {
  // GET → report configuration status only (booleans, never the secret values).
  if (req.method === "GET") {
    return Response.json({
      resendApiKey: Boolean(Netlify.env.get("RESEND_API_KEY")),
      orderFromEmail: Boolean(Netlify.env.get("ORDER_FROM_EMAIL")),
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Wrap the whole POST flow so any unexpected throw still returns structured
  // JSON ({ ok, error }) instead of a 500 HTML page. A non-JSON response would
  // leave the admin panel with an empty error field and the generic
  // "Feil ved sending" message — exactly what we want to avoid.
  try {
    // Fail fast with a clear message when the key is missing, rather than letting
    // sendEmail() silently "skip" — for a diagnostic endpoint a missing key is the
    // single most common cause and the admin needs to see it spelled out.
    if (!Netlify.env.get("RESEND_API_KEY")) {
      return Response.json(
        { ok: false, error: "Mangler API-nøkkel – RESEND_API_KEY er ikke satt i Netlify Environment Variables." },
        { status: 400 },
      );
    }

    // The recipient is optional — fall back to Resend's reserved test inbox so the
    // endpoint is callable with an empty body.
    let recipientEmail = "delivered@resend.dev";
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.recipientEmail) recipientEmail = String(body.recipientEmail);
    } catch {
      // Empty/invalid body is fine; keep the default recipient.
    }

    const result = await sendEmail({
      to: recipientEmail,
      subject: "Test Email from Resend",
      html: `<h1>This is a test email!</h1><p>If you can read this, your Resend integration is working.</p>`,
      text: "This is a test email! If you can read this, your Resend integration is working.",
    });

    if (result.status === "error") {
      console.error("[send-test-email]", result.reason);
      return Response.json({ ok: false, error: describeError(result.reason) }, { status: 502 });
    }

    // "skipped" should not happen here (we checked the key above), but guard anyway
    // so the admin never sees a false "sent" when nothing actually went out.
    if (result.status === "skipped") {
      return Response.json(
        { ok: false, error: "Mangler API-nøkkel – e-posten ble ikke sendt." },
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
