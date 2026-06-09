import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sanity from '@sanity/astro';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // Tvinger Astro til å bygge prosjektet på server-nivå (SSR) for Netlify
  output: 'server',
  
  // Kobler prosjektet eksplisitt til Netlify-adapteren
  adapter: netlify({
    edgeMiddleware: false
  }),

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
