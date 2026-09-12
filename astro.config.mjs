// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // TODO: replace with your real domain before deploying
  site: 'https://jimmylubega.com',
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss()]
  }
});
