// On-demand producer report — powers the "Send rapport nå" button in the
// Kurator hub. Sends a single producer the same weekly performance summary the
// scheduled producer-weekly-report sends every Monday, but for one recipient on
// request. Additive and admin-gated; it reuses the shared Resend email path.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { sendEmail } from "../lib/email.mts";
import { requireAdmin } from "../lib/require-admin.mts";

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { producer_email } = await req.json();
  if (!producer_email) return Response.json({ error: "producer_email required" }, { status: 400 });

  const now = new Date();
  const periodEnd = new Date(now);
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - 7);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const prodRows = await db.sql`
      SELECT DISTINCT producer, producer_email FROM products
      WHERE producer_email = ${producer_email} LIMIT 1
    `;
    const p = (prodRows as any[])[0];
    if (!p) return Response.json({ error: "Producer not found" }, { status: 404 });

    const products = await db.sql`
      SELECT slug, name, price_nok FROM products
      WHERE producer_email = ${producer_email} AND active = TRUE
    `;

    const orders = await db.sql`
      SELECT o.stripe_session_id, o.amount_total, o.currency, o.customer_name, o.created_at, o.items
      FROM orders o
      WHERE o.created_at >= ${fmt(periodStart)}
        AND o.created_at < ${fmt(periodEnd)}
        AND o.producer_endpoint = ${producer_email}
      ORDER BY o.created_at DESC
    `;

    const totalRevenue = (orders as any[]).reduce((sum: number, o: any) => sum + (Number(o.amount_total) / 100), 0);
    const nokFmt = new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 });

    const ordersHtml = (orders as any[]).length > 0
      ? (orders as any[]).map((o: any) => {
          const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
          const productName = items[0]?.name || 'Produkt';
          return `<tr>
            <td style="padding:8px 0;color:#2A2723;font-size:13px;">${new Date(o.created_at).toLocaleDateString('nb-NO')}</td>
            <td style="padding:8px 0;color:#2A2723;font-size:13px;">${productName}</td>
            <td style="padding:8px 0;color:#2A2723;font-size:13px;">${o.customer_name || '—'}</td>
            <td style="padding:8px 0;color:#2A2723;font-size:13px;text-align:right;">${nokFmt.format(Number(o.amount_total) / 100)}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="4" style="padding:16px 0;color:#6F6A5F;font-size:13px;">Ingen bestillinger denne uken.</td></tr>`;

    const productListHtml = (products as any[]).map((prod: any) =>
      `<li style="padding:4px 0;color:#5C5C5C;font-size:13px;">${prod.name} — ${nokFmt.format(prod.price_nok)}</li>`
    ).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ECE7DB;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ECE7DB;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#F4F1EA;border:1px solid rgba(42,39,35,0.08);">
        <tr><td style="padding:28px 36px 8px;border-bottom:1px solid rgba(42,39,35,0.08);">
          <div style="font-family:Georgia,serif;font-size:20px;color:#2A2723;">ScandiJapandi</div>
          <div style="font-size:11px;color:#6F6A5F;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;">Ukentlig produsentrapport</div>
        </td></tr>
        <tr><td style="padding:32px 36px;font-family:-apple-system,Helvetica,Arial,sans-serif;">
          <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:24px;font-weight:normal;color:#2A2723;">Hei, ${p.producer}.</h1>
          <p style="margin:0 0 24px;font-size:13px;color:#6F6A5F;">${fmt(periodStart)} — ${fmt(periodEnd)}</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:16px;background:#fff;border:1px solid rgba(42,39,35,0.08);text-align:center;width:50%;">
                <div style="font-size:28px;font-family:Georgia,serif;color:#2A2723;">${(orders as any[]).length}</div>
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6F6A5F;margin-top:4px;">Bestillinger</div>
              </td>
              <td style="width:8px;"></td>
              <td style="padding:16px;background:#fff;border:1px solid rgba(42,39,35,0.08);text-align:center;width:50%;">
                <div style="font-size:28px;font-family:Georgia,serif;color:#2A2723;">${nokFmt.format(totalRevenue)}</div>
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6F6A5F;margin-top:4px;">Omsetning</div>
              </td>
            </tr>
          </table>

          <h2 style="font-family:Georgia,serif;font-size:16px;font-weight:normal;color:#2A2723;margin:0 0 12px;">Bestillinger denne uken</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(42,39,35,0.08);margin-bottom:24px;">
            ${ordersHtml}
          </table>

          <h2 style="font-family:Georgia,serif;font-size:16px;font-weight:normal;color:#2A2723;margin:0 0 12px;">Dine aktive produkter</h2>
          <ul style="margin:0;padding:0 0 0 0;list-style:none;">${productListHtml}</ul>

          <p style="margin:32px 0 0;font-size:13px;color:#6F6A5F;line-height:1.6;">
            Spørsmål? Svar på denne e-posten eller kontakt oss på
            <a href="mailto:hello@scandijapandi.no" style="color:#2A2723;">hello@scandijapandi.no</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid rgba(42,39,35,0.08);font-size:11px;color:#6F6A5F;">
          ScandiJapandi · Nordisk håndverk for verden
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const result = await sendEmail({
      to: producer_email,
      subject: `Din ukentlige rapport — ${fmt(periodStart)} til ${fmt(periodEnd)}`,
      html,
      text: `Hei ${p.producer}.\n\nBestillinger: ${(orders as any[]).length}\nOmsetning: ${nokFmt.format(totalRevenue)}\n\nScandiJapandi`,
      replyTo: Netlify.env.get("SHOP_EMAIL") || undefined,
    });

    if (!result.ok) {
      return Response.json({ error: result.reason || "E-post feilet" }, { status: 502 });
    }

    await db.sql`
      INSERT INTO producer_reports (producer_email, period_start, period_end, orders_count, revenue_nok)
      VALUES (${producer_email}, ${fmt(periodStart)}, ${fmt(periodEnd)}, ${(orders as any[]).length}, ${Math.round(totalRevenue * 100)})
    `;

    return Response.json({ ok: true, orders: (orders as any[]).length, revenue: totalRevenue });
  } catch (err) {
    console.error("[admin-send-producer-report]", err instanceof Error ? err.message : err);
    return Response.json({ error: "request failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/admin/kurator/send-producer-report",
};
