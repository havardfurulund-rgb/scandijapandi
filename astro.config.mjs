import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/static';
import sanity from '@sanity/astro';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// Single source of truth for the Sanity connection. Prefer env vars (set in the
// Netlify UI) but fall back to the known public project so the storefront build
// and the embedded Studio always target the same dataset.
const SANITY_PROJECT_ID = process.env.PUBLIC_SANITY_PROJECT_ID || 'v7f0k69w';
const SANITY_DATASET = process.env.PUBLIC_SANITY_DATASET || 'production';
// Optional read token for private datasets. When present we skip the CDN so the
// freshly published products are read through the authenticated API.
const SANITY_READ_TOKEN = process.env.SANITY_API_READ_TOKEN;

export default defineConfig({
  output: 'static',
  adapter: netlify(),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: true }),
    sanity({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      useCdn: !SANITY_READ_TOKEN,
      ...(SANITY_READ_TOKEN ? { token: SANITY_READ_TOKEN } : {}),
      studioUrl: '/studio',
    }),
  ],
});

