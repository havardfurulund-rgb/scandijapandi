// ─────────────────────────────────────────────────────────────────────────────
//  MIDLERTIDIG HARDKODET ADMIN-INNLOGGING
//
//  Dette er en enkel, midlertidig løsning for raskt å komme inn på /admin mens
//  Netlify Identity settes opp. Den eksisterende Identity-flyten er beholdt og
//  kan tas i bruk igjen senere – denne filen legger bare til en snarvei.
//
//  👉 SLIK ENDRER DU PASSORDET:
//     Bytt verdien på ADMIN_PASSWORD under, ELLER (anbefalt) sett miljøvariabelen
//     ADMIN_PASSWORD i Netlify (Site settings → Environment variables) for å
//     overstyre uten å endre koden. Standardpassordet er "scandi2026".
// ─────────────────────────────────────────────────────────────────────────────
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "scandi2026";

// Navnet på øktcookien som settes ved vellykket innlogging.
export const ADMIN_COOKIE = "sj_admin";

// Hemmelig verdi som lagres i den httpOnly-cookien. Passordet lekker dermed
// aldri til nettleseren. Endrer du denne (eller setter ADMIN_SESSION_TOKEN),
// blir alle aktive midlertidige innlogginger logget ut.
const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN || "sj-temp-admin-v1";

// Hvor lenge en innlogging varer, i sekunder (12 timer som standard).
const MAX_AGE = 60 * 60 * 12;

/** True hvis forespørselen bærer en gyldig midlertidig admin-cookie. */
export function hasTempAdmin(req: Request): boolean {
  const cookies = req.headers.get("cookie") || "";
  return cookies.split(/;\s*/).some((c) => c === `${ADMIN_COOKIE}=${SESSION_TOKEN}`);
}

/** True hvis https brukes – styrer om cookien skal merkes Secure. */
export function isSecure(req: Request): boolean {
  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return true;
  }
}

/** Set-Cookie-verdi som logger inn (httpOnly, så JS ikke kan lese tokenet). */
export function loginCookie(secure: boolean): string {
  return `${ADMIN_COOKIE}=${SESSION_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure ? "; Secure" : ""}`;
}

/** Set-Cookie-verdi som logger ut (sletter cookien umiddelbart). */
export function logoutCookie(secure: boolean): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}
