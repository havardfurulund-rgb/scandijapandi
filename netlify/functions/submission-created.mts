// Triggered by Netlify Forms on every verified submission (the filename
// `submission-created` is the event name). It mirrors the two public forms —
// the interest/community signup and the producer/designer registration — into
// the `leads` table so the collected audience data is queryable and segmentable
// as a company asset. Netlify Forms remains the system of record; this is a
// best-effort copy that never blocks the submission.
import type { Context } from "@netlify/functions";
import { db } from "../lib/db.mts";

interface FormPayload {
  form_name: string;
  data: Record<string, unknown>;
}

function toText(v: unknown): string | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(", ");
  const s = String(v).trim();
  return s.length ? s : null;
}

export default async (req: Request, context: Context) => {
  let payload: FormPayload | undefined;
  try {
    ({ payload } = (await req.json()) as { payload: FormPayload });
  } catch {
    return new Response("Bad payload", { status: 400 });
  }
  if (!payload) return new Response("No payload", { status: 400 });

  const data = payload.data || {};
  // Interests come from a checkbox group; Netlify may send them as an array or
  // a comma-joined string. Normalise to an array for the JSONB column.
  const rawInterests = (data as any).interests ?? (data as any)["interests[]"];
  const interests = Array.isArray(rawInterests)
    ? rawInterests
    : toText(rawInterests)?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  try {
    await db.sql`
      INSERT INTO leads
        (form_name, persona, name, email, company, website, interests, market_interest, message, raw)
      VALUES (
        ${payload.form_name || null},
        ${toText((data as any).persona)},
        ${toText((data as any).name)},
        ${toText((data as any).email)},
        ${toText((data as any).company)},
        ${toText((data as any).website)},
        ${JSON.stringify(interests)}::jsonb,
        ${toText((data as any).market) ?? toText((data as any).market_interest)},
        ${toText((data as any).message)},
        ${JSON.stringify(data)}::jsonb
      )
    `;
  } catch (err) {
    // Do not fail the form submission if the mirror write fails.
    console.error("[submission-created]", err instanceof Error ? err.message : err);
  }

  return new Response("OK");
};
