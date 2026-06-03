import { defineConfig } from 'astro/config';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

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
    // Build-time Tailwind. `applyBaseStyles: false` keeps Tailwind's preflight
    // reset out of every route by default — the storefront opts in by importing
    // `src/styles/global.css`, so the embedded Studio at /studio stays pristine.
    tailwind({ applyBaseStyles: false }),
  ],
});
