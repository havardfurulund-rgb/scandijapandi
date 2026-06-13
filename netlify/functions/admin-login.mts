// Pålitelig, kodebasert admin-innlogging (hovedløsning).
//
// Tre endepunkter som lar /admin slippe deg inn med brukernavn + passord, uten
// Netlify Identity. Begge deler sjekkes her på serveren og lekker aldri til
// nettleseren; ved suksess settes en httpOnly øktcookie som /api/admin/products
// også godtar. Netlify Identity er beholdt som valgfri backup.
//
// 👉 Brukernavn og passord endres i ../lib/temp-admin.mts
//    (ADMIN_USERNAME / ADMIN_PASSWORD).
import type { Config, Context } from "@netlify/functions";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  hasTempAdmin,
  isSecure,
  loginCookie,
  logoutCookie,
} from "../lib/temp-admin.mts";

export default async (req: Request, _context: Context) => {
  const { pathname } = new URL(req.url);
  const secure = isSecure(req);

  // GET /api/admin/session — brukes av forsiden og /admin for å vise riktig UI.
  if (pathname.endsWith("/session")) {
    return Response.json({ authenticated: hasTempAdmin(req) });
  }

  // POST /api/admin/logout — sletter øktcookien.
  if (pathname.endsWith("/logout")) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Set-Cookie": logoutCookie(secure) },
    });
  }

  // POST /api/admin/login — sjekk brukernavn + passord og sett øktcookie.
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let username = "";
  let password = "";
  try {
    const body = await req.json();
    username = String(body?.username ?? "");
    password = String(body?.password ?? "");
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return Response.json({ error: "Feil brukernavn eller passord." }, { status: 401 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": loginCookie(secure) },
  });
};

export const config: Config = {
  path: ["/api/admin/login", "/api/admin/logout", "/api/admin/session"],
};
