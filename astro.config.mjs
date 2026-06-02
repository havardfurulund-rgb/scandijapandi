import { defineConfig } from 'astro/config';
import sanity from '@sanity/astro';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    react(),
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
      dataset: 'production',
      studios: [
        {
          name: 'default',
          title: 'Studio',
          basePath: '/studio',
          config: './sanity.config.ts',
        },
      ],
    }),
  ],
});
