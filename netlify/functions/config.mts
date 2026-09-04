// Public, non-secret runtime config for the storefront (e.g. LINE Official Account URL).
import type { Config } from "@netlify/functions";
export default async (_req: Request) =>
  Response.json(
    { line_url: Netlify.env.get("LINE_OFFICIAL_URL") || null },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
export const config: Config = { path: "/api/config" };
