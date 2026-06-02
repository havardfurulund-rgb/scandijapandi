import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';

export default defineConfig({
  name: 'default',
  title: 'ScandiJapandi Studio',
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || '',
  dataset: 'production',
  basePath: '/studio',
  plugins: [deskTool()],
  schema: {
    types: [],
  },
});
