import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/static';
import sanity from '@sanity/astro';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  adapter: netlify(),
  integrations: [
    react(), 
    tailwind({ applyBaseStyles: true }),
    sanity({
      projectId: 'v7f0k69w',
      dataset: 'production',
      useCdn: true,
      studioUrl: '/studio',
    }),
  ],
});
