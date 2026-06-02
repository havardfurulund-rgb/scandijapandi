import { defineConfig } from 'astro/config';
import sanity from '@sanity/astro';

export default defineConfig({
  integrations: [
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
      dataset: 'production',
      studioBasePath: '/studio',
      useCdn: false,
    }),
  ],
});
