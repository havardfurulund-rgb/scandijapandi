// Sender en innsending til et Netlify-skjema fra server-side (Stripe-webhooken).
//
// Netlify Forms er innebygd i plattformen: når en innsending registreres, sender
// Netlify automatisk et e-postvarsel til adressen som er satt opp i Netlify UI
// (Notifications → Emails and webhooks). Ingen API-nøkler, ingen SMTP, ingen
// eksterne tjenester – derfor er dette den enkleste e-postløsningen.
//
// Best-effort: funksjonen kaster aldri, slik at en e-postfeil aldri blokkerer
// ordrehåndteringen. Innsendingen POSTes til det statiske skjema-skjelettet
// (/__forms.html) på sidens egen URL, slik at Netlify sin skjemabehandling
// fanger den opp.
export type NotifyResult = { ok: boolean; reason?: string };

export async function submitNetlifyForm(
  formName: string,
  fields: Record<string, string>,
): Promise<NotifyResult> {
  const siteUrl =
    Netlify.env.get("URL") ||
    Netlify.env.get("DEPLOY_PRIME_URL") ||
    Netlify.env.get("DEPLOY_URL");
  if (!siteUrl) return { ok: false, reason: "site URL er ikke tilgjengelig" };

  try {
    const body = new URLSearchParams({ "form-name": formName, ...fields });
    const res = await fetch(`${siteUrl}/__forms.html`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
