import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import sanity from '@sanity/astro';

export default defineConfig({
  output: 'static',
  adapter: netlify(),
  i18n: {
    defaultLocale: 'no',
    locales: ['no', 'en', 'ja'],
    routing: {
      prefixDefaultLocale: false   // Gjør norsk til rot-URL
    }
  },
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
