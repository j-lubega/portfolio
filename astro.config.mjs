// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  // Production domain per the client brief (Phase 13 registers it). Pending Open question 1.
  site: 'https://jlpro-po.com',
  integrations: [
    sitemap({
      // Internal review pages never belong in the sitemap.
      filter: (page) => !page.includes('/design'),
    }),
    react(),
    icon({
      // Only the glyphs listed here are bundled; add to the list as sections need them.
      include: {
        lucide: [
          'sun',
          'moon',
          'lightbulb',
          'lightbulb-off',
          'arrow-right',
          'arrow-up-right',
          'external-link',
          'menu',
          'x',
          'check',
          'calendar',
          'clock',
          'graduation-cap',
          'award',
          'shield-check',
          'server',
          'cloud',
          'terminal',
          'git-branch',
          'activity',
          'mail',
          'copy',
        ],
        'simple-icons': [
          'amazonwebservices',
          'kubernetes',
          'terraform',
          'ansible',
          'linux',
          'docker',
          'githubactions',
          'prometheus',
          'grafana',
          'posit',
          'github',
          'linkedin',
          'redhat',
          'rockylinux',
          'ubuntu',
          'python',
          'gnubash',
          'googlecloud',
        ],
      },
    }),
  ],
  // Self-hosted fonts: downloaded at build, subset to latin, served from this origin.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Sans',
      cssVariable: '--font-plex-sans',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      optimizedFallbacks: true,
      display: 'swap',
    },
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'Cascadia Mono', 'Consolas', 'Menlo', 'monospace'],
      optimizedFallbacks: true,
      display: 'swap',
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
