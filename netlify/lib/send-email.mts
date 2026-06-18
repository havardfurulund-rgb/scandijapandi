// Simple email sender using Gmail SMTP via nodemailer.
//
// We dropped Resend temporarily to get email working quickly. This helper sends
// mail straight through a normal Gmail account using a Google "App Password" —
// no domain verification, no API dashboard, nothing to wait for.
//
// Configuration (Netlify UI → Site settings → Environment variables):
//   GMAIL_USER         — the full Gmail address that sends the mail
//                        (e.g. "minbutikk@gmail.com").
//   GMAIL_APP_PASSWORD — a Google App Password (16 characters, NOT your normal
//                        Google password). Create one at
//                        https://myaccount.google.com/apppasswords
//                        (requires 2-Step Verification on the account).
//   ORDER_FROM_EMAIL   — optional display "from" (e.g.
//                        "ScandiJapandi <minbutikk@gmail.com>"). Gmail requires
//                        the address itself to match GMAIL_USER, so this is
//                        mainly useful for adding a sender name.
//
// When the credentials are absent sendEmail() does NOT throw: it returns a
// "skipped" result and logs a notice, so a missing config never breaks checkout
// or the webhook — the order is still persisted and mail can be re-sent once the
// variables are configured.

import nodemailer from "nodemailer";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export type SendEmailResult =
  | { status: "sent"; id?: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; reason: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const user = Netlify.env.get("GMAIL_USER");
  const pass = Netlify.env.get("GMAIL_APP_PASSWORD");
  if (!user || !pass) {
    return { status: "skipped", reason: "GMAIL_USER / GMAIL_APP_PASSWORD is not configured" };
  }

  const from = Netlify.env.get("ORDER_FROM_EMAIL") || user;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });

    return { status: "sent", id: info?.messageId };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}
