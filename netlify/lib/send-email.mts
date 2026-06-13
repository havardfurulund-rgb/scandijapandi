// Thin wrapper around the Resend email API (https://resend.com). Resend is the
// simplest provider to drive from a Netlify Function: a single authenticated
// HTTPS POST, no SDK required.
//
// Configuration (set in the Netlify UI → Site settings → Environment variables):
//   RESEND_API_KEY   — required for email to actually be sent.
//   ORDER_FROM_EMAIL — the verified "from" address (e.g. "ScandiJapandi
//                      <ordre@scandijapandi.no>"). Falls back to Resend's
//                      onboarding sender so the integration works before a
//                      domain is verified.
//
// When RESEND_API_KEY is absent the function does NOT throw: it returns a
// "skipped" result and logs a notice, so a missing key never breaks checkout or
// the webhook — the order is still persisted and can be re-sent once the key is
// configured.

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
  const apiKey = Netlify.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return { status: "skipped", reason: "RESEND_API_KEY is not configured" };
  }

  const from = Netlify.env.get("ORDER_FROM_EMAIL") || "ScandiJapandi <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { status: "error", reason: `Resend responded ${res.status}: ${detail.slice(0, 200)}` };
    }

    const data = await res.json().catch(() => ({}));
    return { status: "sent", id: data?.id };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}
