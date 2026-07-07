// Admin product management API, used by the branded /admin page.
//
// Every mutation is gated behind Netlify Identity: the caller must be a logged
// in user carrying the `admin` role. The browser sends the `nf_jwt` cookie
// automatically on same-origin requests, so getUser() can resolve and authorize
// the request server-side.
import type { Config, Context } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { requireAdmin } from "../lib/require-admin.mts";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Lightweight email shape check — enough to reject obvious mistakes in the
// admin form without pretending to fully validate deliverability.
function isValidEmail(email: string | null): boolean {
  return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async (req: Request, context: Context) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const slugParam = context.params.slug;

  try {
    if (req.method === "GET") {
      const rows = await db.sql`
        SELECT id, slug, name, producer, producer_email, description, price_nok, image_url, active, created_at
        FROM products ORDER BY created_at DESC, id DESC
      `;
      return Response.json({ products: rows });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const name = String(body.name || "").trim();
      const price = Number(body.price_nok ?? body.price);
      const producerEmail = String(body.producer_email || "").trim().toLowerCase();
      if (!name || !Number.isFinite(price)) {
        return Response.json({ error: "name and price are required" }, { status: 400 });
      }
      if (!isValidEmail(producerEmail)) {
        return Response.json({ error: "a valid producer_email is required" }, { status: 400 });
      }
      const slug = slugify(body.slug || name) || `produkt-${Date.now()}`;
      const priceJpy = Number(body.price_jpy);
      const [row] = await db.sql`
        INSERT INTO products (
          slug, name, producer, producer_email, description, price_nok, image_url, active,
          producer_story, producer_location, producer_image_url,
          material, dimensions, care_instructions, origin_story,
          name_en, name_jp, description_en, description_jp, price_jpy,
          stripe_link, stock_quantity, weight_grams, country_of_origin, gallery_urls
        )
        VALUES (
          ${slug}, ${name}, ${body.producer || null}, ${producerEmail},
          ${body.description || null},
          ${Math.round(price)}, ${body.image_url || body.image || null},
          ${body.active === false ? false : true},
          ${body.producer_story || null}, ${body.producer_location || null}, ${body.producer_image_url || null},
          ${body.material || null}, ${body.dimensions || null}, ${body.care_instructions || null}, ${body.origin_story || null},
          ${body.name_en || null}, ${body.name_jp || null}, ${body.description_en || null}, ${body.description_jp || null},
          ${Number.isFinite(priceJpy) ? Math.round(priceJpy) : null},
          ${body.stripe_link || null},
          ${body.stock_quantity != null ? Number(body.stock_quantity) : null},
          ${body.weight_grams != null ? Number(body.weight_grams) : null},
          ${body.country_of_origin || null},
          ${JSON.stringify(Array.isArray(body.gallery_urls) ? body.gallery_urls : [])}::jsonb
        )
        RETURNING *
      `;
      return Response.json({ product: row }, { status: 201 });
    }

    if (req.method === "PUT") {
      if (!slugParam) return Response.json({ error: "slug required" }, { status: 400 });
      const body = await req.json();
      const price = Number(body.price_nok ?? body.price);
      const priceJpy = Number(body.price_jpy);
      // producer_email is required on the product. Only validate/update it when
      // the client sends a value; an omitted field leaves the stored address
      // untouched (COALESCE), so partial updates never blank it out.
      const hasEmail = body.producer_email !== undefined && body.producer_email !== null;
      const producerEmail = hasEmail ? String(body.producer_email).trim().toLowerCase() : null;
      if (hasEmail && !isValidEmail(producerEmail)) {
        return Response.json({ error: "a valid producer_email is required" }, { status: 400 });
      }
      const [row] = await db.sql`
        UPDATE products SET
          name = COALESCE(${body.name ?? null}, name),
          producer = ${body.producer ?? null},
          producer_email = COALESCE(${producerEmail}, producer_email),
          description = ${body.description ?? null},
          price_nok = COALESCE(${Number.isFinite(price) ? Math.round(price) : null}, price_nok),
          image_url = ${body.image_url ?? body.image ?? null},
          active = COALESCE(${typeof body.active === "boolean" ? body.active : null}, active),
          producer_story = ${body.producer_story ?? null},
          producer_location = ${body.producer_location ?? null},
          producer_image_url = ${body.producer_image_url ?? null},
          material = ${body.material ?? null},
          dimensions = ${body.dimensions ?? null},
          care_instructions = ${body.care_instructions ?? null},
          origin_story = ${body.origin_story ?? null},
          name_en = ${body.name_en ?? null},
          name_jp = ${body.name_jp ?? null},
          description_en = ${body.description_en ?? null},
          description_jp = ${body.description_jp ?? null},
          price_jpy = COALESCE(${Number.isFinite(priceJpy) ? Math.round(priceJpy) : null}, price_jpy),
          stripe_link = ${body.stripe_link ?? null},
          stock_quantity = COALESCE(${body.stock_quantity != null ? Number(body.stock_quantity) : null}, stock_quantity),
          weight_grams = COALESCE(${body.weight_grams != null ? Number(body.weight_grams) : null}, weight_grams),
          country_of_origin = ${body.country_of_origin ?? null},
          gallery_urls = ${JSON.stringify(Array.isArray(body.gallery_urls) ? body.gallery_urls : [])}::jsonb,
          updated_at = NOW()
        WHERE slug = ${slugParam}
        RETURNING *
      `;
      if (!row) return Response.json({ error: "not found" }, { status: 404 });
      return Response.json({ product: row });
    }

    if (req.method === "DELETE") {
      if (!slugParam) return Response.json({ error: "slug required" }, { status: 400 });
      await db.sql`DELETE FROM products WHERE slug = ${slugParam}`;
      return new Response(null, { status: 204 });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    console.error("[admin-products]", err instanceof Error ? err.message : err);
    return Response.json({ error: "request failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: ["/api/admin/products", "/api/admin/products/:slug"],
};
