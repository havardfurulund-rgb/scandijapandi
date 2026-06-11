import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemaTypes';

// NOTE: `basePath` is intentionally omitted here — the embedded Studio path is
// controlled by `studioBasePath` in astro.config.mjs. Setting it in both places
// makes the @sanity/astro integration error out.
export default defineConfig({
  name: 'default',
  title: 'ScandiJapandi Studio',
  // Falls back to the known public project id so the Studio always connects to
  // admin, even when PUBLIC_SANITY_PROJECT_ID is not set in the environment.
  // Kept in sync with astro.config.mjs and netlify/functions/checkout.mts.
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'v7f0k69w',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
