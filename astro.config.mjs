import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import sanity from '@sanity/astro';

export default defineConfig({
  output: 'static',
  adapter: netlify(),
  integrations: [
    tailwind({ applyBaseStyles: true }),
    sanity({
      projectId: 'v7f0k69w',
      dataset: 'production',
      useCdn: true,
      studioUrl: '/studio',
    }),
  ],
});
