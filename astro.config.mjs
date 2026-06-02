import { defineConfig } from 'astro/config';
import sanity from '@sanity/astro';
import react from '@astrojs/react';

// Static output (the default) — the embedded Sanity Studio is prerendered into
// `dist/studio/index.html` by the @sanity/astro integration and served as a SPA.
export default defineConfig({
  integrations: [
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
      useCdn: false,
      // Registers and prerenders the Studio route at /studio.
      studioBasePath: '/studio',
    }),
    // Required by Sanity Studio (renders React components).
    react(),
  ],
});
