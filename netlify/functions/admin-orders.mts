// Ordrehistorikk for admin-siden (/admin → seksjonen «Ordrehistorikk»).
//
// Leser ordrene som stripe-webhook-funksjonen har lagret i `orders`-tabellen og
// returnerer dem nyeste først. Read-only: ordrene er fasit fra Stripe, så admin
// trenger bare å se dem – ikke endre dem. Gated bak samme admin-autorisering som
// resten av /api/admin/* (passord-cookie eller Netlify Identity admin-rolle).
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { requireAdmin } from "../lib/require-admin.mts";

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rows = await db.sql`
      SELECT
        stripe_session_id, curator, customer_email, customer_name,
        shipping_address, delivery_notes, items, amount_total, currency,
        routing_status, producer_endpoint, created_at
      FROM orders
      ORDER BY created_at DESC, id DESC
      LIMIT 200
    `;

    const orders = rows.map((r: any) => {
      // `items` is JSONB ([{ slug, name, producer_email, phone }]). The product
      // name lives there; fall back gracefully if the shape is ever different.
      let item: any = null;
      try {
        const items = Array.isArray(r.items) ? r.items : JSON.parse(r.items || "[]");
        item = items[0] ?? null;
      } catch {
        item = null;
      }
      return {
        order_id: r.stripe_session_id,
        product: item?.name || item?.slug || "—",
        producer_email: item?.producer_email || r.producer_endpoint || null,
        amount: Number(r.amount_total) / 100,
        currency: (r.currency || "nok").toUpperCase(),
        customer_name: r.customer_name,
        customer_email: r.customer_email,
        customer_phone: r.delivery_notes,
        shipping_address: r.shipping_address,
        curator: r.curator,
        status: r.routing_status,
        created_at: r.created_at,
      };
    });

    return Response.json({ orders });
  } catch (err) {
    console.error("[admin-orders]", err instanceof Error ? err.message : err);
    return Response.json({ error: "request failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/admin/orders",
};
