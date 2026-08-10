import type { APIRoute } from 'astro';

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

const urlEntry = (loc: string, priority: string, changefreq: string) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
  </url>`;

export const GET: APIRoute = async ({ url }) => {
  // Resolve the API against the origin the request came in on so deploy
  // previews and branch deploys list their own products, then fall back to
  // production. Canonical <loc> values always point at the live domain.
  const origin = url.origin || SITE;

  let productEntries: string[] = [];
  try {
    const res = await fetch(`${origin}/api/products`);
    if (res.ok) {
      const data = await res.json();
      productEntries = (data.products || [])
        .filter((p: any) => p?.slug)
        .map((p: any) => urlEntry(`${SITE}/products/${p.slug}`, '0.9', 'weekly'));
    }
  } catch {
    // Never fail the sitemap over the product feed: serve the static pages.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map((p) => urlEntry(`${SITE}${p.path}`, p.priority, p.changefreq)).join('\n')}
${productEntries.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600',
    },
  });
};
