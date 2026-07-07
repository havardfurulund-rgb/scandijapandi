// AI translation for product fields via the Anthropic API.
// Takes Norwegian product text and returns English + Japanese translations.
// Gated behind admin auth — same as all other /api/admin/* endpoints.
//
// Credentials: works with Netlify AI Gateway (zero-config — Netlify injects
// ANTHROPIC_API_KEY and ANTHROPIC_BASE_URL) as well as a self-provided
// ANTHROPIC_API_KEY. When ANTHROPIC_BASE_URL is unset we fall back to the
// direct Anthropic endpoint, so a manually added sk-ant-… key also works.
import type { Config } from "@netlify/functions";
import { requireAdmin } from "../lib/require-admin.mts";

export default async (req: Request) => {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }
  const baseUrl = Netlify.env.get("ANTHROPIC_BASE_URL") ?? "https://api.anthropic.com";

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, description, origin_story, producer_story, material, care_instructions } = body;

  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const prompt = `You are a luxury e-commerce copywriter for ScandiJapandi, a brand that bridges Scandinavian craftsmanship with Japanese aesthetics. Translate the following Norwegian product information into both English and Japanese.

The brand voice is: quiet, poetic, never salesy. Sentences are short. Language is precise and sensory. Think Kinfolk magazine meets Muji product copy.

For Japanese: use natural, contemporary Japanese that a refined Tokyo consumer would expect from a premium Nordic brand. Avoid overly literal translation — capture the feeling, not just the words.

Return ONLY a valid JSON object with this exact structure, no other text:
{
  "name_en": "...",
  "name_jp": "...",
  "description_en": "...",
  "description_jp": "...",
  "origin_story_en": "...",
  "origin_story_jp": "...",
  "producer_story_en": "...",
  "producer_story_jp": "...",
  "material_en": "...",
  "material_jp": "...",
  "care_en": "...",
  "care_jp": "..."
}

If a field is empty or null, return an empty string "" for that field.

Norwegian product information to translate:
- Product name: ${name || ""}
- Description: ${description || ""}
- Object story (shown as pull quote): ${origin_story || ""}
- Producer story: ${producer_story || ""}
- Material: ${material || ""}
- Care instructions: ${care_instructions || ""}`;

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
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[admin-translate] Anthropic error:", err);
      return Response.json({ error: "Translation failed" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";

    // Strip markdown fences if present
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const translations = JSON.parse(clean);

    return Response.json({ translations });
  } catch (err) {
    console.error("[admin-translate]", err instanceof Error ? err.message : err);
    return Response.json({ error: "Translation failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/admin/translate",
};
