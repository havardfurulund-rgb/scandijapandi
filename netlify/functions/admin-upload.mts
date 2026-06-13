// Bilde-opplasting for admin-siden.
//
// Tar imot én bildefil (multipart/form-data, feltnavn «file»), lagrer den i
// Netlify Blobs og returnerer en stabil URL (/api/images/<key>) som kan brukes
// direkte i <img src> og lagres som produktets image_url.
//
// Endepunktet er gated bak den samme admin-autoriseringen som resten av
// /api/admin/* (midlertidig passord-cookie eller Netlify Identity admin-rolle).
import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { requireAdmin } from "../lib/require-admin.mts";

// Tillatte bildetyper og maksstørrelse. Synkrone funksjoner har en payload-
// grense på ~6 MB, så vi holder oss godt under den.
const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
  ["image/svg+xml", "svg"],
]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Ingen fil mottatt." }, { status: 400 });
    }

    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return Response.json(
        { error: "Filtypen støttes ikke. Bruk JPG, PNG, WebP, GIF, AVIF eller SVG." },
        { status: 415 },
      );
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: "Bildet er for stort (maks 5 MB)." }, { status: 413 });
    }

    // Unik, gjettesikker nøkkel. crypto.randomUUID() er tilgjengelig i runtime.
    const key = `${Date.now().toString(36)}-${crypto.randomUUID()}.${ext}`;

    const store = getStore("product-images");
    const buffer = await file.arrayBuffer();
    await store.set(key, buffer, { metadata: { contentType: file.type } });

    return Response.json({ url: `/api/images/${key}`, key }, { status: 201 });
  } catch (err) {
    console.error("[admin-upload]", err instanceof Error ? err.message : err);
    return Response.json({ error: "Opplasting feilet." }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/admin/upload",
};
