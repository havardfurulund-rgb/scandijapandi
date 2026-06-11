// Admin product management API, used by the branded /admin page.
//
// Every mutation is gated behind Netlify Identity: the caller must be a logged
// in user carrying the `admin` role. The browser sends the `nf_jwt` cookie
// automatically on same-origin requests, so getUser() can resolve and authorize
// the request server-side.
import type { Config, Context } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { db } from "../lib/db.mts";

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

async function requireAdmin(): Promise<Response | null> {
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!user.roles?.includes("admin")) {
    return new Response("Forbidden — admin role required", { status: 403 });
  }
  return null;
}

export default async (req: Request, context: Context) => {
  const denied = await requireAdmin();
  if (denied) return denied;

  const slugParam = context.params.slug;

  try {
    if (req.method === "GET") {
      const rows = await db.sql`
        SELECT id, slug, name, producer, description, price_nok, image_url, active, created_at
        FROM products ORDER BY created_at DESC, id DESC
      `;
      return Response.json({ products: rows });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const name = String(body.name || "").trim();
      const price = Number(body.price_nok ?? body.price);
      if (!name || !Number.isFinite(price)) {
        return Response.json({ error: "name and price are required" }, { status: 400 });
      }
      const slug = slugify(body.slug || name) || `produkt-${Date.now()}`;
      const [row] = await db.sql`
        INSERT INTO products (slug, name, producer, description, price_nok, image_url, active)
        VALUES (
          ${slug}, ${name}, ${body.producer || null}, ${body.description || null},
          ${Math.round(price)}, ${body.image_url || body.image || null},
          ${body.active === false ? false : true}
        )
        RETURNING *
      `;
      return Response.json({ product: row }, { status: 201 });
    }

    if (req.method === "PUT") {
      if (!slugParam) return Response.json({ error: "slug required" }, { status: 400 });
      const body = await req.json();
      const price = Number(body.price_nok ?? body.price);
      const [row] = await db.sql`
        UPDATE products SET
          name = COALESCE(${body.name ?? null}, name),
          producer = ${body.producer ?? null},
          description = ${body.description ?? null},
          price_nok = COALESCE(${Number.isFinite(price) ? Math.round(price) : null}, price_nok),
          image_url = ${body.image_url ?? body.image ?? null},
          active = COALESCE(${typeof body.active === "boolean" ? body.active : null}, active),
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
