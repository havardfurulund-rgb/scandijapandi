// Offentlig visning av opplastede produktbilder fra Netlify Blobs.
//
// Bilder lastes opp via /api/admin/upload og lagres i «product-images»-storet.
// Dette endepunktet serverer dem på en stabil, offentlig URL (/api/images/<key>)
// med riktig Content-Type, slik at de kan brukes direkte i butikkens <img src>.
import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (_req: Request, context: Context) => {
  const key = context.params.key;
  if (!key) return new Response("Not found", { status: 404 });

  try {
    const store = getStore("product-images");
    const result = await store.getWithMetadata(key, { type: "arrayBuffer" });
    if (!result) return new Response("Not found", { status: 404 });

    const contentType =
      (result.metadata?.contentType as string) || "application/octet-stream";

    return new Response(result.data, {
      headers: {
        "Content-Type": contentType,
        // Nøkkelen er innholdsunik, så bildet kan caches aggressivt.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[images]", err instanceof Error ? err.message : err);
    return new Response("Not found", { status: 404 });
  }
};

export const config: Config = {
  path: "/api/images/:key",
};
