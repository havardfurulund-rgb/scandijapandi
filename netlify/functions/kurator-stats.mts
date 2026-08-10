// Public, password-free stats feed behind each curator's personal dashboard at
// /kurator/:ref. Attribution comes from orders.curator, which the checkout
// function fills from the ?ref= code the curator shares.
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";

export default async (req: Request) => {
  const url = new URL(req.url);
  const ref = url.pathname.split("/").pop() || "";

  if (!ref) return Response.json({ error: "ref required" }, { status: 400 });

  try {
    // Find influencer
    const influencers = await db.sql`
      SELECT name, commission_pct FROM influencers WHERE ref_code = ${ref} LIMIT 1
    `;

    // Fall back to any curator who has driven orders
    const influencer = (influencers as any[])[0];
    const name = influencer?.name || ref;
    // Rates are per-curator in the CRM; 10% is the house default.
    const commissionPct = Number(influencer?.commission_pct ?? 10) || 10;

    // Get all orders for this ref code
    const orders = (await db.sql`
      SELECT
        stripe_session_id, items, amount_total, currency, created_at
      FROM orders
      WHERE curator = ${ref}
      ORDER BY created_at DESC
      LIMIT 50
    `) as any[];

    const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.amount_total || 0), 0);
    const commission = Math.round(totalRevenue * (commissionPct / 100));

    // This month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonthRevenue = orders
      .filter((o: any) => new Date(o.created_at) >= startOfMonth)
      .reduce((s: number, o: any) => s + Number(o.amount_total || 0), 0);

    const formattedOrders = orders.map((o: any) => {
      let product = '—';
      try {
        const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
        product = items[0]?.name || items[0]?.slug || '—';
      } catch {}
      return {
        stripe_session_id: o.stripe_session_id,
        product,
        amount_total: Number(o.amount_total || 0),
        created_at: o.created_at,
      };
    });

    return Response.json(
      {
        ref,
        name,
        order_count: orders.length,
        total_revenue: totalRevenue,
        commission,
        commission_pct: commissionPct,
        this_month_revenue: thisMonthRevenue,
        orders: formattedOrders,
      },
      { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } }
    );
  } catch (err) {
    console.error("[kurator-stats]", err);
    return Response.json({ error: "unavailable" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/kurator/:ref",
};
