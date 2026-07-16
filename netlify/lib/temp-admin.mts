// ─────────────────────────────────────────────────────────────────────────────
//  PÅLITELIG, KODEBASERT ADMIN-INNLOGGING (hovedløsning)
//
//  En enkel og robust innlogging for /admin som IKKE er avhengig av Netlify
//  Identity. Brukernavn og passord sjekkes her på serveren og lekker aldri til
//  nettleseren; ved suksess settes en httpOnly øktcookie. Fungerer selv om
//  Identity skulle feile. Netlify Identity er beholdt som valgfri backup.
//
//  👉 SLIK SETTER DU BRUKERNAVN / PASSORD:
//     Konfigureres KUN via miljøvariabler i Netlify
//     (Site settings → Environment variables):
//       • ADMIN_PASSWORD        (påkrevd – uten den er admin-innlogging deaktivert)
//       • ADMIN_SESSION_TOKEN   (påkrevd – hemmelig verdi for øktcookien)
//       • ADMIN_USERNAME        (valgfri – standard "admin")
//     Det finnes bevisst INGEN innebygd standardverdi for passord/token, slik at
//     ingen gyldig legitimasjon ligger i klartekst i kildekoden.
// ─────────────────────────────────────────────────────────────────────────────

// Brukernavnet er ikke en hemmelighet; "admin" er en trygg standard.
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";

// Passord og økt-token leses utelukkende fra miljøvariabler. Mangler de, er
// admin-innlogging deaktivert (se isAdminAuthConfigured / hasTempAdmin under).
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

// Navnet på øktcookien som settes ved vellykket innlogging.
export const ADMIN_COOKIE = "sj_admin";

// Hemmelig verdi som lagres i den httpOnly-cookien. Passordet lekker dermed
// aldri til nettleseren. Endrer du ADMIN_SESSION_TOKEN, blir alle aktive
// innlogginger logget ut.
const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN || "";

// Hvor lenge en innlogging varer, i sekunder (12 timer som standard).
const MAX_AGE = 60 * 60 * 12;

/**
 * True kun hvis både passord og økt-token er satt via miljøvariabler. Er noe av
 * dette utelatt, skal all admin-innlogging nektes – vi faller aldri tilbake på
 * en hardkodet standardverdi.
 */
export function isAdminAuthConfigured(): boolean {
  return ADMIN_PASSWORD.length > 0 && SESSION_TOKEN.length > 0;
}

/** True hvis forespørselen bærer en gyldig midlertidig admin-cookie. */
export function hasTempAdmin(req: Request): boolean {
  if (!isAdminAuthConfigured()) return false;
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
