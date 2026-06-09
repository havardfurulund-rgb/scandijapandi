import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import sanity from '@sanity/astro';

export default defineConfig({
  output: 'static',           // <--- Viktigst
  adapter: netlify(),
  integrations: [
    tailwind({
      applyBaseStyles: true,
    }),
    sanity({
      projectId: 'v7f0k69w',
      dataset: 'production',
      useCdn: true,
      studioUrl: '/studio',
    }),
  ],
  // Fjern eventuelle experimental eller hybrid-innstillinger
});
