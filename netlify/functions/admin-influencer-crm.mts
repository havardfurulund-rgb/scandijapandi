// Influencer CRM API — manages the influencer & media outreach pipeline
import type { Config } from "@netlify/functions";
import { db } from "../lib/db.mts";
import { requireAdmin } from "../lib/require-admin.mts";

export default async (req: Request) => {
const denied = await requireAdmin(req);
if (denied) return denied;

const url = new URL(req.url);
const parts = url.pathname.split("/").filter(Boolean);
const last = parts[parts.length - 1] || "";
const isId = /^\d+$/.test(last);
const isCollection = last === "influencer-crm";
if (!isId && !isCollection) return new Response("Not found", { status: 404 });

try {
if (req.method === "GET" && isCollection) {
const status = url.searchParams.get("status");
const tier = url.searchParams.get("tier");
const country = url.searchParams.get("country");
const search = url.searchParams.get("search");

let rows;
if (status || tier || country || search) {
rows = await db.sql`
SELECT * FROM influencer_crm
WHERE
(${status}::text IS NULL OR status = ${status}::text)
AND (${tier}::text IS NULL OR tier = ${tier}::text)
AND (${country}::text IS NULL OR country = ${country}::text)
AND (${search}::text IS NULL OR
name ILIKE ${'%' + (search || '') + '%'}::text OR
handle_instagram ILIKE ${'%' + (search || '') + '%'}::text OR
notes ILIKE ${'%' + (search || '') + '%'}::text
)
ORDER BY priority ASC, japandi_fit_score DESC, followers_instagram DESC NULLS LAST
`;
} else {
rows = await db.sql`
SELECT * FROM influencer_crm
ORDER BY priority ASC, japandi_fit_score DESC, followers_instagram DESC NULLS LAST
`;
}

const summary = await db.sql`
SELECT status, COUNT(*) as count FROM influencer_crm GROUP BY status
`;

return Response.json({ influencers: rows, summary });
}

if (req.method === "GET" && isId) {
const rows = await db.sql`SELECT * FROM influencer_crm WHERE id = ${Number(last)} LIMIT 1`;
if (!rows.length) return Response.json({ error: "not found" }, { status: 404 });
return Response.json({ influencer: rows[0] });
}

if (req.method === "POST" && isCollection) {
const b = await req.json();
if (!b?.name) return Response.json({ error: "name is required" }, { status: 400 });
const [row] = await db.sql`
INSERT INTO influencer_crm (
name, handle_instagram, handle_tiktok, handle_youtube, handle_line, handle_blog,
email, manager_email, manager_name, language, country, city,
followers_instagram, followers_tiktok, followers_youtube,
engagement_rate, avg_reach_per_post, audience_age_range, audience_gender, audience_countries,
tier, category, japandi_fit_score, japandi_fit_notes, brand_fit,
status, priority, ref_code, commission_pct, payment_method,
last_contacted_at, last_contact_channel, products_sent, post_links,
next_action, next_action_date, notes, ai_summary, source
) VALUES (
${b.name}, ${b.handle_instagram || null}, ${b.handle_tiktok || null},
${b.handle_youtube || null}, ${b.handle_line || null}, ${b.handle_blog || null},
${b.email || null}, ${b.manager_email || null}, ${b.manager_name || null},
${b.language || 'ja'}, ${b.country || 'JP'}, ${b.city || null},
${b.followers_instagram || null}, ${b.followers_tiktok || null}, ${b.followers_youtube || null},
${b.engagement_rate || null}, ${b.avg_reach_per_post || null},
${b.audience_age_range || null}, ${b.audience_gender || null}, ${b.audience_countries || null},
${b.tier || 'micro'}, ${b.category || null},
${b.japandi_fit_score || 3}, ${b.japandi_fit_notes || null}, ${b.brand_fit || 'good'},
${b.status || 'prospect'}, ${b.priority || 2}, ${b.ref_code || null},
${b.commission_pct || 10}, ${b.payment_method || null},
${b.last_contacted_at || null}, ${b.last_contact_channel || null},
${b.products_sent || null}, ${b.post_links || null},
${b.next_action || null}, ${b.next_action_date || null},
${b.notes || null}, ${b.ai_summary || null}, ${'manual'}
) RETURNING *
`;
return Response.json({ influencer: row }, { status: 201 });
}

if (req.method === "PUT" && isId) {
const b = await req.json();
const [row] = await db.sql`
UPDATE influencer_crm SET
name = COALESCE(${b.name || null}, name),
handle_instagram = ${b.handle_instagram ?? null},
handle_tiktok = ${b.handle_tiktok ?? null},
handle_youtube = ${b.handle_youtube ?? null},
handle_line = ${b.handle_line ?? null},
handle_blog = ${b.handle_blog ?? null},
email = ${b.email ?? null},
manager_email = ${b.manager_email ?? null},
manager_name = ${b.manager_name ?? null},
language = COALESCE(${b.language || null}, language),
country = ${b.country ?? null},
city = ${b.city ?? null},
followers_instagram = ${b.followers_instagram ?? null},
followers_tiktok = ${b.followers_tiktok ?? null},
followers_youtube = ${b.followers_youtube ?? null},
engagement_rate = ${b.engagement_rate ?? null},
avg_reach_per_post = ${b.avg_reach_per_post ?? null},
audience_age_range = ${b.audience_age_range ?? null},
audience_gender = ${b.audience_gender ?? null},
audience_countries = ${b.audience_countries ?? null},
tier = COALESCE(${b.tier || null}, tier),
category = ${b.category ?? null},
japandi_fit_score = COALESCE(${b.japandi_fit_score ?? null}, japandi_fit_score),
japandi_fit_notes = ${b.japandi_fit_notes ?? null},
brand_fit = ${b.brand_fit ?? null},
status = COALESCE(${b.status || null}, status),
priority = COALESCE(${b.priority ?? null}, priority),
ref_code = ${b.ref_code ?? null},
commission_pct = COALESCE(${b.commission_pct ?? null}, commission_pct),
payment_method = ${b.payment_method ?? null},
last_contacted_at = ${b.last_contacted_at ?? null},
last_contact_channel = ${b.last_contact_channel ?? null},
products_sent = ${b.products_sent ?? null},
posts_published = COALESCE(${b.posts_published ?? null}, posts_published),
post_links = ${b.post_links ?? null},
total_clicks = COALESCE(${b.total_clicks ?? null}, total_clicks),
total_orders = COALESCE(${b.total_orders ?? null}, total_orders),
total_revenue_nok = COALESCE(${b.total_revenue_nok ?? null}, total_revenue_nok),
next_action = ${b.next_action ?? null},
next_action_date = ${b.next_action_date ?? null},
notes = ${b.notes ?? null},
ai_summary = ${b.ai_summary ?? null},
updated_at = NOW()
WHERE id = ${Number(last)}
RETURNING *
`;
if (!row) return Response.json({ error: "not found" }, { status: 404 });
return Response.json({ influencer: row });
}

if (req.method === "DELETE" && isId) {
await db.sql`DELETE FROM influencer_crm WHERE id = ${Number(last)}`;
return new Response(null, { status: 204 });
}

return new Response("Not found", { status: 404 });
} catch (err) {
console.error("[admin-influencer-crm]", err instanceof Error ? err.message : err);
return Response.json({ error: "request failed" }, { status: 500 });
}
};

export const config: Config = {
path: ["/api/admin/influencer-crm", "/api/admin/influencer-crm/:id"],
};
