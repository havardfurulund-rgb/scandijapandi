// AI translation via the Anthropic API (admin only).
//
// Two modes:
//   default  — product fields: Norwegian → English + Japanese (brand voice)
//   episode  — 北の手 / Kita no Te subtitle cues: Norwegian speech → Japanese
//              subtitle + dubbing text + English, cue by cue, timings preserved
//
// Credentials: Netlify AI Gateway (zero-config — Netlify injects ANTHROPIC_API_KEY
// and ANTHROPIC_BASE_URL) or a self-provided ANTHROPIC_API_KEY.
import type { Config } from "@netlify/functions";
import { requireAdmin } from "../lib/require-admin.mts";

const EPISODE_SYSTEM = `You are the localisation editor for 北の手 (Kita no Te), a Japanese-language channel presenting Nordic makers in their own workshops. You translate Norwegian interview speech into natural spoken Japanese for dubbing and subtitles, and into English.

Rules for Japanese:
- Register: 丁寧語 (です・ます). The maker is speaking to a Japanese viewer with respect but warmth. Never casual だ・である, never excessive 敬語.
- Preserve the person: hesitations may be dropped, but keep their concrete words (place names, material names, tools). Do not add praise, adjectives or marketing.
- Craft vocabulary: use terms a Japanese 職人 would use (轆轤, 釉薬, 手織り, 手吹き, 木目, 節). Prefer native words over katakana where a natural term exists.
- Place names in katakana: ノルウェー, ベルゲン, ハルダンゲル, ロフォーテン, フィヨルド. Keep the Latin original in brackets on first mention in subtitles only.
- Subtitle constraint (jp_sub): each line ≤ 18 full-width characters, ≤ 2 lines per cue, lines separated by \\n. If the source is longer, split meaning across cues only if unavoidable; never compress meaning.
- Dubbing text (jp_dub): a spoken version matching the original cue duration within ±10%; may be slightly shorter than the subtitle.

Rules for English (en): plain, quiet, first person, British spelling, no exclamation marks.

Return ONLY valid JSON: {"cues":[{"id":1,"start":"00:00:05,120","end":"00:00:08,900","no":"...","jp_sub":"...","jp_dub":"...","en":"..."}]}
Keep ids, start and end exactly as given, in the same order. No markdown, no commentary.`;

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

  // ── Episode mode ────────────────────────────────────────────────────────
  if (body?.mode === "episode") {
    const cues = Array.isArray(body.cues) ? body.cues : [];
    if (!cues.length) return Response.json({ error: "cues required" }, { status: 400 });
    if (cues.length > 400) return Response.json({ error: "max 400 cues per request" }, { status: 400 });

    const context = [
      `Episode context:`,
      `- Maker: ${body.producer_name || "unknown"}`,
      `- Location: ${body.location || "unknown"}`,
      `- Materials: ${body.materials || "unknown"}`,
      `- Objects: ${body.objects || "unknown"}`,
    ].join("\n");

    const userMsg = `${context}\n\nCues (JSON):\n${JSON.stringify(
      cues.map((c: any, i: number) => ({ id: c.id ?? i + 1, start: String(c.start || ""), end: String(c.end || ""), no: String(c.no || "") }))
    )}`;

    try {
      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 8000,
          system: EPISODE_SYSTEM,
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      if (!res.ok) {
        console.error("[admin-translate:episode] Anthropic error:", await res.text());
        return Response.json({ error: "Translation failed" }, { status: 502 });
      }
      const data = await res.json();
      const text = (data.content?.[0]?.text || "").replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(text);
      const out = Array.isArray(parsed?.cues) ? parsed.cues : [];
      return Response.json({ cues: out });
    } catch (err) {
      console.error("[admin-translate:episode]", err instanceof Error ? err.message : err);
      return Response.json({ error: "Translation failed" }, { status: 500 });
    }
  }

  // ── Product mode (default) ──────────────────────────────────────────────
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
