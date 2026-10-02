import type { APIRoute } from 'astro';
import { HTML_LANG, LANGS, loadIssue, issueUrl, chapterUrl, type Lang } from '../lib/kitanote';

// Sitemap for search engines. Rendered on request (not at build time) so newly
// published products show up without a rebuild — the same reason the product
// pages and the front-page grid read from /api/products at runtime.
export const prerender = false;

const SITE = 'https://scandijapandi.no';

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/makers', priority: '0.7', changefreq: 'monthly' },
  { path: '/shipping', priority: '0.6', changefreq: 'monthly' },
  { path: '/terms', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.5', changefreq: 'monthly' },
];

// Slugs come from the database, so escape anything that would break the XML.
const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!,
  );

// Element order follows the sitemaps.org schema sequence (loc, lastmod,
// changefreq, priority) so the output passes strict XSD validators.
const urlEntry = (
  loc: string,
  priority: string,
  changefreq: string,
  alternates: { hreflang: string; href: string }[] = [],
) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${alternates
      .map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${escapeXml(a.href)}"/>`)
      .join('')}
  </url>`;

export const GET: APIRoute = async ({ url }) => {
  // Resolve the API against the origin the request came in on so deploy
  // previews and branch deploys list their own products, then fall back to
  // production. Canonical <loc> values always point at the live domain.
  const origin = url.origin || SITE;

  let productEntries: string[] = [];
  try {
    const res = await fetch(`${origin}/api/products`);
    if (!res.ok) {
      console.warn(`[sitemap] product feed responded ${res.status} — products omitted`);
    } else {
      const data = await res.json();
      // /api/products answers 200 with { products: [], error: 'unavailable' }
      // when its own database read fails, so an ok status alone doesn't mean the
      // catalogue is genuinely empty. Treat that as a failure and log it, rather
      // than quietly publishing a well-formed sitemap with every product gone.
      if (!data.error && Array.isArray(data.products)) {
        productEntries = data.products
          .filter((p: any) => p?.slug)
          .map((p: any) => urlEntry(`${SITE}/products/${p.slug}`, '0.9', 'weekly'));
      } else {
        console.warn('[sitemap] product feed returned error or empty — products omitted');
      }
    }
  } catch (err) {
    // Never fail the sitemap over the product feed: serve the static pages.
    console.warn('[sitemap] could not fetch products:', err);
  }

  // 北の手 · Kita no Te: issue + published chapters in ja / en / nb, each with
  // its hreflang alternates (x-default = ja). Pages whose Japanese has not
  // been reviewed (jp_qa: false) carry noindex, so they are left out until
  // the native QA is done.
  let magazineEntries: string[] = [];
  try {
    const { issue, chapters } = await loadIssue();
    if (issue.jp_qa) {
      const pages: { path: (l: Lang) => string; priority: string }[] = [
        { path: issueUrl, priority: '0.8' },
        ...chapters.filter((c) => c.jp_qa).map((c) => ({ path: (l: Lang) => chapterUrl(l, c.slug), priority: '0.7' })),
      ];
      magazineEntries = pages.flatMap((p) => {
        const alternates = [
          ...LANGS.map((l) => ({ hreflang: HTML_LANG[l], href: `${SITE}${p.path(l)}` })),
          { hreflang: 'x-default', href: `${SITE}${p.path('ja')}` },
        ];
        return LANGS.map((l) => urlEntry(`${SITE}${p.path(l)}`, p.priority, 'monthly', alternates));
      });
    }
  } catch (err) {
    console.warn('[sitemap] could not load magazine:', err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${STATIC_PAGES.map((p) => urlEntry(`${SITE}${p.path}`, p.priority, p.changefreq)).join('\n')}
${magazineEntries.join('\n')}
${productEntries.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600',
    },
  });
};
