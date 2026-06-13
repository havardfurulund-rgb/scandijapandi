// ─────────────────────────────────────────────────────────────────────────────
//  PÅLITELIG, KODEBASERT ADMIN-INNLOGGING (hovedløsning)
//
//  En enkel og robust innlogging for /admin som IKKE er avhengig av Netlify
//  Identity. Brukernavn og passord sjekkes her på serveren og lekker aldri til
//  nettleseren; ved suksess settes en httpOnly øktcookie. Fungerer selv om
//  Identity skulle feile. Netlify Identity er beholdt som valgfri backup.
//
//  👉 SLIK ENDRER DU BRUKERNAVN / PASSORD:
//     Bytt verdiene på ADMIN_USERNAME og ADMIN_PASSWORD rett under. Du kan også
//     (anbefalt i produksjon) overstyre dem uten å endre koden ved å sette
//     miljøvariablene ADMIN_USERNAME / ADMIN_PASSWORD i Netlify
//     (Site settings → Environment variables).
// ─────────────────────────────────────────────────────────────────────────────

// 👇 ENDRE BRUKERNAVNET HER (eller via miljøvariabelen ADMIN_USERNAME).
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";

// 👇 ENDRE PASSORDET HER (eller via miljøvariabelen ADMIN_PASSWORD).
//    Bruk gjerne et sterkt passord. Standard er "ScandiAdmin2026!".
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ScandiAdmin2026!";

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
