// Transaksjonell e-post for ScandiJapandi.
//
// HVORFOR DENNE FINNES
// --------------------
// Netlify Forms er perfekt for ett ting: å varsle butikkens EGEN faste innboks
// (adressen som settes i Netlify UI). Men Netlify Forms kan IKKE sende e-post
// til en mottaker som varierer per innsending – altså verken til kunden eller
// til den aktuelle produsenten. For en profesjonell kundeopplevelse må kunden
// faktisk få en pen kvittering, og produsenten må få varselet sitt direkte.
//
// Derfor sender vi disse to e-postene via Resend (https://resend.com): ett enkelt
// HTTP-kall, ingen SMTP, ingen avhengigheter. Nøkkelen ligger i RESEND_API_KEY.
// Hvis nøkkelen mangler, degraderer alt pent – funksjonen kaster aldri, slik at
// en e-postfeil ALDRI blokkerer ordrehåndteringen. Butikkens interne varsel går
// uansett via Netlify Forms, så ingen ordre går tapt.
//
// Avsenderadresse: sett EMAIL_FROM til en adresse på et domene du har verifisert
// i Resend (f.eks. "ScandiJapandi <ordre@scandijapandi.no>"). Uten verifisert
// domene kan Resend bare sende fra onboarding@resend.dev og til din egen konto-
// e-post – nok til å teste, men du bør verifisere domenet for å nå kunder.

export type EmailResult = { ok: boolean; id?: string; reason?: string };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Standard avsender. Overstyr med EMAIL_FROM (verifisert domene anbefales). */
export function defaultFrom(): string {
  return Netlify.env.get("EMAIL_FROM") || "ScandiJapandi <onboarding@resend.dev>";
}

/** True hvis Resend er konfigurert (ekte utgående e-post er mulig). */
export function emailConfigured(): boolean {
  return !!Netlify.env.get("RESEND_API_KEY");
}

/**
 * Send én e-post via Resend. Kaster aldri – returnerer alltid et resultat slik
 * at kalleren kan logge utfallet uten å risikere å blokkere ordreflyten.
 */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const key = Netlify.env.get("RESEND_API_KEY");
  if (!key) return { ok: false, reason: "RESEND_API_KEY er ikke satt" };

  const to = (Array.isArray(opts.to) ? opts.to : [opts.to])
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  if (!to.length) return { ok: false, reason: "ingen mottaker" };

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: defaultFrom(),
        to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.text ? { text: opts.text } : {}),
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Resend legger en lesbar feilmelding i `message` (f.eks. «domain is not
      // verified»). Ta den med så admin kan feilsøke deliverability raskt.
      const reason = (body && (body.message || body.name)) || `HTTP ${res.status}`;
      return { ok: false, reason: String(reason) };
    }
    return { ok: true, id: body?.id };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  E-postmaler — rene, merkevaretro HTML-maler i japandi-stil.
//  All styling er inline (krav for e-postklienter). Fargene speiler butikken:
//  paper #F4F1EA, ink #2A2723, stone #6F6A5F, clay #A6694C.
// ─────────────────────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

/** Linjeskift i fritekst (f.eks. adresse) → <br> for trygg HTML-visning. */
function nl2br(s: unknown): string {
  return esc(s).replace(/\n/g, "<br />");
}

/** Felles ramme: sentrert «kort» på varm bakgrunn, med ScandiJapandi-topp. */
function shell(inner: string): string {
  return `<!doctype html><html lang="nb"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#ECE7DB;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">ScandiJapandi</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ECE7DB;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#F4F1EA;border:1px solid rgba(42,39,35,0.08);">
        <tr><td style="padding:28px 36px 8px;border-bottom:1px solid rgba(42,39,35,0.08);">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#2A2723;letter-spacing:0.5px;">ScandiJapandi</div>
        </td></tr>
        <tr><td style="padding:32px 36px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#2A2723;">
          ${inner}
        </td></tr>
        <tr><td style="padding:20px 36px 28px;border-top:1px solid rgba(42,39,35,0.08);font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;color:#6F6A5F;">
          Nordisk og japansk håndverk · ScandiJapandi
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Liten oppsummeringsrad (etikett + verdi) brukt i ordredetaljene. */
function row(label: string, value: string): string {
  if (!value) return "";
  return `<tr>
    <td style="padding:8px 0;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#6F6A5F;width:42%;vertical-align:top;">${esc(label)}</td>
    <td style="padding:8px 0;font-size:14px;color:#2A2723;vertical-align:top;">${value}</td>
  </tr>`;
}

export interface OrderEmailData {
  productName: string;
  orderId: string;
  amount: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  curator?: string | null;
}

/** Pen kundekvittering — det kunden ser i innboksen etter et kjøp. */
export function customerConfirmationEmail(d: OrderEmailData): { subject: string; html: string; text: string } {
  const hei = d.customerName ? `Hei ${esc(d.customerName)},` : "Hei,";
  const details = [
    row("Produkt", esc(d.productName)),
    row("Beløp", esc(d.amount)),
    row("Ordrenummer", esc(d.orderId)),
    d.shippingAddress ? row("Leveres til", nl2br(d.shippingAddress)) : "",
  ].join("");

  const html = shell(`
    <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:#2A2723;">Takk for bestillingen</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#2A2723;">${hei}</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#2A2723;">
      Vi har mottatt bestillingen din og gleder oss til å sende den til deg. Her er detaljene:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(42,39,35,0.08);border-bottom:1px solid rgba(42,39,35,0.08);margin-bottom:24px;">
      ${details}
    </table>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#2A2723;">
      Vi gir deg beskjed så snart varen er på vei. Har du spørsmål, svar gjerne direkte på denne e-posten.
    </p>
    <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#2A2723;">Vennlig hilsen,<br />ScandiJapandi</p>
  `);

  const text = [
    `${d.customerName ? `Hei ${d.customerName},` : "Hei,"}`,
    ``,
    `Takk for bestillingen din hos ScandiJapandi!`,
    `Produkt: ${d.productName}`,
    `Beløp: ${d.amount}`,
    `Ordrenummer: ${d.orderId}`,
    d.shippingAddress ? `\nLeveres til:\n${d.shippingAddress}` : "",
    ``,
    `Vi gir deg beskjed når varen sendes.`,
    `Vennlig hilsen, ScandiJapandi`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  return { subject: `Ordrebekreftelse – ${d.productName}`, html, text };
}

/** Varsel til produsenten — alt de trenger for å pakke og sende ordren. */
export function producerNotificationEmail(d: OrderEmailData): { subject: string; html: string; text: string } {
  const details = [
    row("Produkt", esc(d.productName)),
    row("Ordrenummer", esc(d.orderId)),
    row("Beløp", esc(d.amount)),
    row("Kunde", esc([d.customerName, d.customerEmail].filter(Boolean).join(" · "))),
    d.customerPhone ? row("Telefon", esc(d.customerPhone)) : "",
    d.shippingAddress ? row("Leveringsadresse", nl2br(d.shippingAddress)) : "",
    d.curator ? row("Henvist av", esc(d.curator)) : "",
  ].join("");

  const html = shell(`
    <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:#2A2723;">Ny bestilling</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#2A2723;">
      Det har kommet en ny bestilling på <strong>${esc(d.productName)}</strong>. Vennligst klargjør varen for forsendelse til adressen under.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(42,39,35,0.08);border-bottom:1px solid rgba(42,39,35,0.08);margin-bottom:24px;">
      ${details}
    </table>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#6F6A5F;">
      Denne meldingen ble sendt automatisk av ScandiJapandi ved fullført betaling.
    </p>
  `);

  const text = [
    `Ny bestilling: ${d.productName}`,
    `Ordrenummer: ${d.orderId}`,
    `Beløp: ${d.amount}`,
    `Kunde: ${[d.customerName, d.customerEmail].filter(Boolean).join(" · ") || "—"}`,
    d.customerPhone ? `Telefon: ${d.customerPhone}` : "",
    d.shippingAddress ? `Leveringsadresse:\n${d.shippingAddress}` : "",
    d.curator ? `Henvist av: ${d.curator}` : "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  return { subject: `Ny bestilling – ${d.productName} (${d.orderId})`, html, text };
}

/** Enkel testmelding fra admin – bekrefter at Resend faktisk leverer e-post. */
export function testEmail(recipient: string): { subject: string; html: string; text: string } {
  const html = shell(`
    <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:#2A2723;">Test-e-post</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2A2723;">
      Dette er en test sendt fra ScandiJapandi-admin til <strong>${esc(recipient)}</strong>.
    </p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#2A2723;">
      Ser du denne e-posten, er utgående e-post satt opp riktig. 🎉
    </p>
  `);
  const text = `Test-e-post fra ScandiJapandi-admin til ${recipient}. Ser du denne, fungerer utgående e-post.`;
  return { subject: "Test-e-post fra ScandiJapandi", html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Flerspråklige e-postmaler
// ─────────────────────────────────────────────────────────────────────────────

/** Kundekvittering på engelsk */
export function customerConfirmationEmailEN(d: OrderEmailData): { subject: string; html: string; text: string } {
  const greeting = d.customerName ? `Dear ${esc(d.customerName)},` : "Dear Customer,";
  const details = [
    row("Product", esc(d.productName)),
    row("Amount", esc(d.amount)),
    row("Order number", esc(d.orderId)),
    d.shippingAddress ? row("Ship to", nl2br(d.shippingAddress)) : "",
  ].join("");

  const html = shell(`
    <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:#2A2723;">Thank you for your order</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#2A2723;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#2A2723;">
      We have received your order and look forward to sending it to you. Here are your order details:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(42,39,35,0.08);border-bottom:1px solid rgba(42,39,35,0.08);margin-bottom:24px;">
      ${details}
    </table>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#2A2723;">
      We will notify you as soon as your item is on its way. If you have any questions, please reply directly to this email.
    </p>
    <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#2A2723;">Warm regards,<br />ScandiJapandi</p>
  `);

  const text = [
    greeting, ``,
    `Thank you for your order with ScandiJapandi!`,
    `Product: ${d.productName}`,
    `Amount: ${d.amount}`,
    `Order number: ${d.orderId}`,
    d.shippingAddress ? `\nShip to:\n${d.shippingAddress}` : "",
    ``, `We will notify you when your item is dispatched.`,
    `Warm regards, ScandiJapandi`,
  ].filter(Boolean).join("\n");

  return { subject: `Order confirmation — ${d.productName}`, html, text };
}

/** Kundekvittering på japansk (med engelsk under) */
export function customerConfirmationEmailJA(d: OrderEmailData): { subject: string; html: string; text: string } {
  const namePart = d.customerName ? `${esc(d.customerName)}様` : "お客様";
  const details = [
    row("商品 / Product", esc(d.productName)),
    row("金額 / Amount", esc(d.amount)),
    row("注文番号 / Order No.", esc(d.orderId)),
    d.shippingAddress ? row("お届け先 / Ship to", nl2br(d.shippingAddress)) : "",
  ].join("");

  const html = shell(`
    <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:#2A2723;">ご注文ありがとうございます</h1>
    <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#2A2723;">${namePart}</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#2A2723;">
      ご注文を承りました。以下がご注文の詳細です。
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(42,39,35,0.08);border-bottom:1px solid rgba(42,39,35,0.08);margin-bottom:24px;">
      ${details}
    </table>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#2A2723;">
      発送の準備が整い次第、改めてご連絡いたします。ご不明な点がございましたら、このメールに直接ご返信ください。
    </p>
    <div style="margin:24px 0;padding:16px;border-top:1px solid rgba(42,39,35,0.08);">
      <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#6F6A5F;">— In English —</p>
      <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#6F6A5F;">Dear ${d.customerName ? esc(d.customerName) : "Customer"}, thank you for your order. We will notify you as soon as your item is on its way.</p>
    </div>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#2A2723;">ScandiJapandi</p>
  `);

  const text = [
    `${namePart}`, ``,
    `ご注文ありがとうございます。`,
    `商品: ${d.productName}`,
    `金額: ${d.amount}`,
    `注文番号: ${d.orderId}`,
    d.shippingAddress ? `お届け先:\n${d.shippingAddress}` : "",
    ``, `— In English —`,
    `Thank you for your order with ScandiJapandi.`,
    `We will notify you when your item is dispatched.`,
  ].filter(Boolean).join("\n");

  return { subject: `ご注文確認 — ScandiJapandi`, html, text };
}

/** Produsentvarsel på norsk + engelsk */
export function producerNotificationEmailBilingual(d: OrderEmailData): { subject: string; html: string; text: string } {
  const details = [
    row("Produkt / Product", esc(d.productName)),
    row("Ordrenummer / Order No.", esc(d.orderId)),
    row("Beløp / Amount", esc(d.amount)),
    row("Kunde / Customer", esc([d.customerName, d.customerEmail].filter(Boolean).join(" · "))),
    d.customerPhone ? row("Telefon / Phone", esc(d.customerPhone)) : "",
    d.shippingAddress ? row("Leveringsadresse / Ship to", nl2br(d.shippingAddress)) : "",
    d.curator ? row("Henvist av / Referred by", esc(d.curator)) : "",
  ].join("");

  const html = shell(`
    <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:#2A2723;">Ny bestilling / New Order</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#2A2723;">
      Det har kommet en ny bestilling på <strong>${esc(d.productName)}</strong>. Vennligst klargjør varen for forsendelse.<br/>
      <span style="color:#6F6A5F;font-size:13px;">A new order has been placed for <strong>${esc(d.productName)}</strong>. Please prepare the item for shipment.</span>
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(42,39,35,0.08);border-bottom:1px solid rgba(42,39,35,0.08);margin-bottom:24px;">
      ${details}
    </table>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#6F6A5F;">
      Denne meldingen ble sendt automatisk av ScandiJapandi ved fullført betaling.<br/>
      This message was sent automatically by ScandiJapandi upon completed payment.
    </p>
  `);

  const text = [
    `Ny bestilling / New Order: ${d.productName}`,
    `Ordrenummer: ${d.orderId}`,
    `Beløp: ${d.amount}`,
    `Kunde: ${[d.customerName, d.customerEmail].filter(Boolean).join(" · ") || "—"}`,
    d.customerPhone ? `Telefon: ${d.customerPhone}` : "",
    d.shippingAddress ? `Leveringsadresse:\n${d.shippingAddress}` : "",
    d.curator ? `Henvist av: ${d.curator}` : "",
  ].filter(Boolean).join("\n");

  return { subject: `Ny bestilling / New Order — ${d.productName}`, html, text };
}
