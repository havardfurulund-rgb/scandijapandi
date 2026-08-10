// Scheduled function — weekly summary of orders, revenue and new circle leads
// for the shop admin. Runs Mondays at 07:00 UTC, alongside the producer report
// (that is 09:00 Oslo in summer time, 08:00 in winter — Netlify cron is UTC and
// does not follow Norwegian DST).
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { sendEmail } from "../lib/email.mts";

// Product names and curator codes come from the database and from Stripe
// metadata, so escape them before they go into the email markup.
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export default async (_req: Request) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString('nb-NO');
  const nokFmt = (n: number) => new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(n / 100);

  try {
    // Orders this week
    const orders = (await db.sql`
      SELECT amount_total, curator, routing_status, created_at, items
      FROM orders WHERE created_at >= ${weekAgo.toISOString()}
      ORDER BY created_at DESC
    `) as any[];

    // New circle leads this week
    const leads = (await db.sql`
      SELECT segment, COUNT(*) as count
      FROM circle_leads WHERE created_at >= ${weekAgo.toISOString()}
      GROUP BY segment
    `) as any[];

    // Total revenue
    const totalRevenue = orders.reduce((s, o) => s + Number(o.amount_total || 0), 0);

    // Top curator
    const curatorMap: Record<string, number> = {};
    orders.forEach((o: any) => {
      if (o.curator) curatorMap[o.curator] = (curatorMap[o.curator] || 0) + Number(o.amount_total || 0);
    });
    const topCurator = Object.entries(curatorMap).sort((a, b) => b[1] - a[1])[0];

    const leadsTotal = leads.reduce((s, l) => s + Number(l.count), 0);

    const ordersHtml = orders.length > 0
      ? orders.map((o: any) => {
          let product = '—';
          try { const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]'); product = items[0]?.name || '—'; } catch {}
          return `<tr>
            <td style="padding:6px 0;font-size:13px;color:#2A2723;">${new Date(o.created_at).toLocaleDateString('nb-NO')}</td>
            <td style="padding:6px 0;font-size:13px;color:#2A2723;">${esc(product)}</td>
            <td style="padding:6px 0;font-size:13px;color:#2A2723;">${esc(o.curator || '—')}</td>
            <td style="padding:6px 0;font-size:13px;color:#2A2723;text-align:right;">${nokFmt(Number(o.amount_total || 0))}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="4" style="padding:12px 0;color:#6F6A5F;font-size:13px;">Ingen ordrer denne uken.</td></tr>`;

    const html = `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ECE7DB;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ECE7DB;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#F4F1EA;border:1px solid rgba(42,39,35,0.08);">
        <tr><td style="padding:28px 36px 8px;border-bottom:1px solid rgba(42,39,35,0.08);">
          <div style="font-family:Georgia,serif;font-size:20px;color:#2A2723;">ScandiJapandi</div>
          <div style="font-size:11px;color:#6F6A5F;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;">Ukentlig admin-rapport · ${fmt(weekAgo)} – ${fmt(now)}</div>
        </td></tr>
        <tr><td style="padding:32px 36px;font-family:-apple-system,Helvetica,Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:16px;background:#fff;border:1px solid rgba(42,39,35,0.08);text-align:center;width:33%;">
                <div style="font-size:28px;font-family:Georgia,serif;color:#2A2723;">${orders.length}</div>
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6F6A5F;margin-top:4px;">Ordrer</div>
              </td>
              <td style="width:8px;"></td>
              <td style="padding:16px;background:#fff;border:1px solid rgba(42,39,35,0.08);text-align:center;width:33%;">
                <div style="font-size:28px;font-family:Georgia,serif;color:#2A2723;">${nokFmt(totalRevenue)}</div>
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6F6A5F;margin-top:4px;">Omsetning</div>
              </td>
              <td style="width:8px;"></td>
              <td style="padding:16px;background:#fff;border:1px solid rgba(42,39,35,0.08);text-align:center;width:33%;">
                <div style="font-size:28px;font-family:Georgia,serif;color:#2A2723;">${leadsTotal}</div>
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6F6A5F;margin-top:4px;">Nye leads</div>
              </td>
            </tr>
          </table>
          ${topCurator ? `<p style="font-size:13px;color:#6F6A5F;margin:0 0 24px;">🏆 Beste kurator: <strong style="color:#2A2723;">${esc(topCurator[0])}</strong> — ${nokFmt(topCurator[1])}</p>` : ''}
          <h2 style="font-family:Georgia,serif;font-size:16px;font-weight:normal;color:#2A2723;margin:0 0 12px;">Ordrer denne uken</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(42,39,35,0.08);margin-bottom:24px;">
            <thead><tr>
              <th style="padding:8px 0;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6F6A5F;font-weight:normal;text-align:left;">Dato</th>
              <th style="padding:8px 0;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6F6A5F;font-weight:normal;text-align:left;">Produkt</th>
              <th style="padding:8px 0;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6F6A5F;font-weight:normal;text-align:left;">Kurator</th>
              <th style="padding:8px 0;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6F6A5F;font-weight:normal;text-align:right;">Beløp</th>
            </tr></thead>
            <tbody>${ordersHtml}</tbody>
          </table>
          <p style="font-size:12px;color:#6F6A5F;">
            <a href="https://scandijapandi.no/admin" style="color:#2A2723;">Åpne admin-panelet →</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid rgba(42,39,35,0.08);font-size:11px;color:#6F6A5F;">
          ScandiJapandi Collection · Automatisk rapport
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const adminEmail = Netlify.env.get("SHOP_EMAIL") || "hei@skmnordic.com";
    // sendEmail never throws — it reports the outcome so a missing API key or an
    // unverified domain shows up in the function log instead of failing silently.
    const result = await sendEmail({
      to: adminEmail,
      subject: `Ukesrapport ScandiJapandi · ${fmt(weekAgo)} – ${fmt(now)}`,
      html,
      text: `Ordrer: ${orders.length} · Omsetning: ${nokFmt(totalRevenue)} · Nye leads: ${leadsTotal}`,
    });

    if (!result.ok) {
      console.error("[admin-weekly-report] e-post ikke sendt:", result.reason);
    } else {
      console.log(`[admin-weekly-report] sendt til admin — ordrer: ${orders.length}, leads: ${leadsTotal}`);
    }

    return Response.json({ ok: result.ok, sent: result.ok, reason: result.reason, orders: orders.length, revenue: totalRevenue });
  } catch (err) {
    console.error("[admin-weekly-report]", err);
    return Response.json({ error: "failed" }, { status: 500 });
  }
};

export const config: Config = {
  schedule: "0 7 * * 1",
};
