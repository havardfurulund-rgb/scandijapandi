// Sends a welcome email to new Private Circle members.
// Called by the leads API after a successful segment submission.
import type { Config } from "@netlify/functions";
import { sendEmail } from "../lib/email.mts";

const TRANSLATIONS = {
  no: {
    subject: "Velkommen til ScandiJapandi Private Circle",
    heading: "Du er med.",
    body: "Vi tar kontakt når noe verdig din oppmerksomhet ankommer — nye objekter, håndverkshistorier og eksklusive forhåndsvisninger.",
    closing: "Vennlig hilsen,",
  },
  en: {
    subject: "Welcome to the ScandiJapandi Private Circle",
    heading: "You're in.",
    body: "We'll be in touch when something worthy of your attention arrives — new objects, maker stories, and exclusive previews.",
    closing: "Warm regards,",
  },
  jp: {
    subject: "ScandiJapandi プライベートサークルへようこそ",
    heading: "ご登録ありがとうございます。",
    body: "新しいオブジェクト、作り手の物語、限定プレビューなど、ご注目に値する情報をお届けします。",
    closing: "心よりお礼申し上げます、",
  },
};

export async function sendCircleWelcome(email: string, language: string, segment: string): Promise<void> {
  const lang = (language === 'jp' || language === 'ja') ? 'jp' : language === 'no' ? 'no' : 'en';
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  const segmentNote = segment === 'maker'
    ? `<p style="margin:16px 0 0;font-size:13px;color:#6F6A5F;">As a maker, we may also reach out about partnership opportunities when the timing is right.</p>`
    : segment === 'curator'
    ? `<p style="margin:16px 0 0;font-size:13px;color:#6F6A5F;">As a curator, we may share exclusive access and early previews for your audience.</p>`
    : '';

  const html = `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ECE7DB;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ECE7DB;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#F4F1EA;border:1px solid rgba(42,39,35,0.08);">
        <tr><td style="padding:28px 36px 8px;border-bottom:1px solid rgba(42,39,35,0.08);">
          <div style="font-family:Georgia,serif;font-size:20px;color:#2A2723;letter-spacing:0.5px;">ScandiJapandi</div>
        </td></tr>
        <tr><td style="padding:32px 36px;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#2A2723;">
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;font-weight:normal;color:#2A2723;">${t.heading}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#5C5C5C;">${t.body}</p>
          ${segmentNote}
          <p style="margin:32px 0 0;font-size:15px;color:#2A2723;">${t.closing}<br/>ScandiJapandi</p>
        </td></tr>
        <tr><td style="padding:20px 36px 28px;border-top:1px solid rgba(42,39,35,0.08);font-size:12px;color:#6F6A5F;">
          Nordisk og japansk håndverk · ScandiJapandi ·
          <a href="https://scandijapandi.no/privacy" style="color:#6F6A5F;">Privacy</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await sendEmail({
    to: email,
    subject: t.subject,
    html,
    text: `${t.heading}\n\n${t.body}\n\n${t.closing}\nScandiJapandi`,
  });
}

export const config: Config = {
  path: "/.netlify/functions/circle-welcome",
};

export default async (_req: Request) => {
  return new Response("Not a public endpoint", { status: 404 });
};
