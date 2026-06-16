// Diagnostic endpoint for confirming the Resend email integration works end to
// end. POST a JSON body of { "recipientEmail": "you@example.com" } and a test
// message is delivered through the same shared sendEmail() helper that checkout
// and the Stripe webhook use — so a success here means real order mail will
// flow too.
//
//   curl -X POST /api/send-test-email -d '{"recipientEmail":"you@example.com"}'
//
// The response mirrors sendEmail()'s outcome:
//   200 { status: "sent" }     — Resend accepted the message.
//   200 { status: "skipped" }  — RESEND_API_KEY is not configured yet; nothing
//                                was sent, but the integration is wired up.
//   502 { status: "error" }    — Resend rejected the request (bad key/sender).
import type { Config, Context } from "@netlify/functions";
import { sendEmail } from "../lib/send-email.mts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
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
    return Response.json({ message: "Failed to send test email", ...result }, { status: 502 });
  }

  console.log(`[send-test-email] ${result.status} → ${recipientEmail}`);
  return Response.json({ message: "Test email request processed", recipient: recipientEmail, ...result });
};

export const config: Config = {
  path: "/api/send-test-email",
};
