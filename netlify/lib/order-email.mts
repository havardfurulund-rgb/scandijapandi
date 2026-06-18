// Builds the producer-notification email sent when a customer completes a
// Stripe checkout. Pure data-in / strings-out so it can be unit-reasoned about
// and reused. The HTML is a self-contained, inline-styled template (email
// clients strip <style> blocks and external CSS) in the storefront's calm,
// editorial palette.

export interface OrderEmailData {
  productName: string;
  productSlug: string;
  producerName?: string | null;
  quantity?: number;
  amountFormatted: string; // e.g. "2 450 kr"
  orderRef: string; // Stripe session id / order reference
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null; // already formatted, may contain newlines
  curator?: string | null; // influencer/referral, if any
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #ece7df;color:#8a8278;font-size:11px;letter-spacing:.12em;text-transform:uppercase;vertical-align:top;width:40%;">${esc(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #ece7df;color:#26241f;font-size:15px;vertical-align:top;">${value}</td>
    </tr>`;
}

export function orderEmailSubject(d: OrderEmailData): string {
  return `Ny bestilling: ${d.productName} (${d.orderRef})`;
}

export function orderEmailText(d: OrderEmailData): string {
  const lines = [
    "Ny bestilling er mottatt",
    "",
    `Produkt: ${d.productName}${d.producerName ? ` — ${d.producerName}` : ""}`,
    `Antall: ${d.quantity ?? 1}`,
    `Beløp: ${d.amountFormatted}`,
    `Ordrenummer: ${d.orderRef}`,
    "",
    "Kunde:",
    `  Navn: ${d.customerName || "—"}`,
    `  E-post: ${d.customerEmail || "—"}`,
    `  Telefon: ${d.customerPhone || "—"}`,
    `  Leveringsadresse:`,
    `    ${(d.shippingAddress || "—").replace(/\n/g, "\n    ")}`,
  ];
  if (d.curator) lines.push("", `Henvist av: ${d.curator}`);
  lines.push("", "Denne e-posten ble sendt automatisk av ScandiJapandi da bestillingen ble betalt.");
  return lines.join("\n");
}

// ---- Customer confirmation -----------------------------------------------
// A short, friendly receipt sent to the CUSTOMER right after a successful
// Stripe purchase. Deliberately minimal — it confirms the order was received
// and shows the reference; it is not an invoice.

export function customerEmailSubject(d: OrderEmailData): string {
  return `Takk for bestillingen din – ${d.productName}`;
}

export function customerEmailText(d: OrderEmailData): string {
  return [
    `Hei${d.customerName ? ` ${d.customerName}` : ""},`,
    "",
    "Takk for bestillingen din hos ScandiJapandi!",
    "",
    `Produkt: ${d.productName}`,
    `Beløp: ${d.amountFormatted}`,
    `Ordrenummer: ${d.orderRef}`,
    "",
    "Vi gir deg beskjed når varen sendes.",
    "",
    "Vennlig hilsen",
    "ScandiJapandi",
  ].join("\n");
}

export function customerEmailHtml(d: OrderEmailData): string {
  return `<!doctype html>
<html lang="nb">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ea;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ece7df;">
        <tr><td style="padding:32px 36px 24px;border-bottom:1px solid #ece7df;">
          <p style="margin:0;color:#8a8278;font-size:11px;letter-spacing:.18em;text-transform:uppercase;">ScandiJapandi</p>
          <h1 style="margin:8px 0 0;color:#26241f;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;">Takk for bestillingen din</h1>
          <p style="margin:12px 0 0;color:#6f685e;font-size:14px;line-height:1.6;">Hei${d.customerName ? ` ${esc(d.customerName)}` : ""}, vi har mottatt bestillingen din. Du får beskjed når varen sendes.</p>
        </td></tr>
        <tr><td style="padding:28px 36px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${row("Produkt", `<strong style="font-weight:600;">${esc(d.productName)}</strong>`)}
            ${row("Beløp", esc(d.amountFormatted))}
            ${row("Ordrenummer", `<code style="font-size:13px;color:#26241f;">${esc(d.orderRef)}</code>`)}
          </table>
        </td></tr>
        <tr><td style="padding:20px 36px 32px;border-top:1px solid #ece7df;">
          <p style="margin:0;color:#9a9288;font-size:12px;line-height:1.6;">Vennlig hilsen ScandiJapandi. Du trenger ikke svare på denne e-posten.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function orderEmailHtml(d: OrderEmailData): string {
  const shippingHtml = esc(d.shippingAddress || "—").replace(/\n/g, "<br />");
  return `<!doctype html>
<html lang="nb">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ea;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ece7df;">
        <tr><td style="padding:32px 36px 24px;border-bottom:1px solid #ece7df;">
          <p style="margin:0;color:#8a8278;font-size:11px;letter-spacing:.18em;text-transform:uppercase;">ScandiJapandi</p>
          <h1 style="margin:8px 0 0;color:#26241f;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;">Ny bestilling er mottatt</h1>
          <p style="margin:12px 0 0;color:#6f685e;font-size:14px;line-height:1.6;">Hei${d.producerName ? ` ${esc(d.producerName)}` : ""}, en kunde har nettopp betalt for et av produktene dine. Detaljene står nedenfor — vennligst klargjør og send bestillingen.</p>
        </td></tr>
        <tr><td style="padding:28px 36px 8px;">
          <p style="margin:0 0 4px;color:#8a8278;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Produkt</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${row("Produkt", `<strong style="font-weight:600;">${esc(d.productName)}</strong>`)}
            ${d.producerName ? row("Produsent", esc(d.producerName)) : ""}
            ${row("Antall", String(d.quantity ?? 1))}
            ${row("Beløp", esc(d.amountFormatted))}
            ${row("Ordrenummer", `<code style="font-size:13px;color:#26241f;">${esc(d.orderRef)}</code>`)}
            ${d.curator ? row("Henvist av", esc(d.curator)) : ""}
          </table>
        </td></tr>
        <tr><td style="padding:20px 36px 28px;">
          <p style="margin:0 0 4px;color:#8a8278;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">Kunde</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${row("Navn", esc(d.customerName || "—"))}
            ${row("E-post", d.customerEmail ? `<a href="mailto:${esc(d.customerEmail)}" style="color:#a8624a;text-decoration:none;">${esc(d.customerEmail)}</a>` : "—")}
            ${row("Telefon", d.customerPhone ? `<a href="tel:${esc(d.customerPhone)}" style="color:#a8624a;text-decoration:none;">${esc(d.customerPhone)}</a>` : "—")}
            ${row("Leveringsadresse", shippingHtml)}
          </table>
        </td></tr>
        <tr><td style="padding:20px 36px 32px;border-top:1px solid #ece7df;">
          <p style="margin:0;color:#9a9288;font-size:12px;line-height:1.6;">Denne e-posten ble sendt automatisk av ScandiJapandi da bestillingen ble betalt via Stripe. Du trenger ikke svare på den.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
