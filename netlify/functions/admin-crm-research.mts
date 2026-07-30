// AI research assistant — analyses a producer website/Instagram and returns
// a structured Japandi assessment and suggested CRM fields.
//
// Credentials follow the same pattern as admin-translate.mts: works with the
// zero-config Netlify AI Gateway (which injects ANTHROPIC_API_KEY and
// ANTHROPIC_BASE_URL) as well as a self-provided Anthropic key.
import type { Config } from "@netlify/functions";
import { requireAdmin } from "../lib/require-admin.mts";

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { url, name } = body ?? {};
  if (!url && !name) return Response.json({ error: "url or name required" }, { status: 400 });

  const baseUrl = Netlify.env.get("ANTHROPIC_BASE_URL") ?? "https://api.anthropic.com";
  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const prompt = `You are a curator for ScandiJapandi Collection — a premium platform bridging Scandinavian craft with Japanese aesthetics.

Analyse this producer/designer based on the information provided:
Name: ${name || "Unknown"}
Website/Instagram: ${url || "Not provided"}

Based on what you know about this maker (or can reasonably infer from their name and web presence), provide a structured assessment.

Return ONLY valid JSON with this exact structure:
{
  "japandi_score": 1-5 (5=perfect fit, 1=poor fit),
  "fits_japandi": "yes" | "partial" | "no",
  "japandi_notes": "1-2 sentences explaining the Japandi alignment",
  "category": "primary product category",
  "main_products": "brief description of their products",
  "ai_summary": "2-3 sentence summary of who they are and why they might fit ScandiJapandi",
  "outreach_channel": "email" | "instagram" | "agent" | "email+instagram",
  "suggested_priority": 1 | 2 | 3,
  "contact_approach": "brief note on how to approach them"
}

Japandi criteria:
- Natural materials (wood, wool, linen, clay, glass, stone)
- Quiet, minimal aesthetic — no loud patterns or colours
- Small-scale or studio production preferred
- Strong story of place, craft, or material
- Wabi-sabi affinity: honest imperfection, purposeful form`;

  try {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("[crm-research] Anthropic error:", await res.text());
      return Response.json({ error: "Research failed" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "{}";
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const assessment = JSON.parse(clean);

    return Response.json({ assessment });
  } catch (err) {
    console.error("[crm-research]", err instanceof Error ? err.message : err);
    return Response.json({ error: "Research failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/admin/crm/research",
};
