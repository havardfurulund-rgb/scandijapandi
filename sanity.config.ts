import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

// NOTE: `basePath` is intentionally omitted here — the embedded Studio path is
// controlled by `studioBasePath` in astro.config.mjs. Setting it in both places
// makes the @sanity/astro integration error out.
export default defineConfig({
  name: 'default',
  title: 'ScandiJapandi Studio',
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool()],
  schema: {
    types: [],
  },
});
