import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // Hybrid gjør at forsiden og Sanity-produktene bygges statisk og trygt,
  // mens API-endepunkter kjører live på serveren.
  output: 'hybrid',
  
  adapter: netlify(),

  integrations: [
    react(),
    tailwind(),
    sanity({
      projectId: 'v7f0k69w',
      dataset: 'production',
      useCdn: false,
      studioUrl: '/studio',
    }),
  ],
});
