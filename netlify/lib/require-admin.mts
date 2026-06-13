// Delt tilgangskontroll for admin-API-ene (/api/admin/*).
//
// Tilgang gis enten via den midlertidige hardkodede passord-innloggingen
// (øktcookie satt i temp-admin.mts) ELLER via en Netlify Identity-bruker som
// bærer `admin`-rollen. Nettleseren sender begge cookiene automatisk på
// same-origin-forespørsler, så autoriseringen kan gjøres på serveren.
import { getUser } from "@netlify/identity";
import { hasTempAdmin } from "./temp-admin.mts";

/**
 * Returnerer et 401/403-svar hvis forespørselen ikke er en autorisert admin,
 * eller `null` hvis tilgang er innvilget.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  // Midlertidig hurtig-admin: en gyldig hardkodet-innloggingscookie gir tilgang
  // uten Netlify Identity. Fjern denne linjen når Identity tas i bruk igjen.
  if (hasTempAdmin(req)) return null;

  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!user.roles?.includes("admin")) {
    return new Response("Forbidden — admin role required", { status: 403 });
  }
  return null;
}
