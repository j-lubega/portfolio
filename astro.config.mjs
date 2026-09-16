// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import icon from 'astro-icon';
import { sourceFileFor, lastmodFor, sitemapMeta } from './scripts/sitemap-meta.mjs';

// https://astro.build/config
export default defineConfig({
  // Production domain per the client brief (Phase 13 registers it). Pending Open question 1.
  site: 'https://jlpro-po.com',
  // 4321 falls inside a Windows-reserved TCP port range on this machine, causing EACCES on bind.
  server: { port: 3000 },
  // Retired routes. vercel.json carries the same rules as real 301s; these keep dev/preview honest.
  redirects: {
    '/contact': '/connect',
    '/blog': '/',
  },
  integrations: [
    sitemap({
      // Internal review pages never belong in the sitemap. /404 is not a real route, so it is
      // never in the page list @astrojs/sitemap builds from in the first place.
      filter: (page) => !page.includes('/design'),
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const meta = sitemapMeta(pathname);
        const source = sourceFileFor(pathname);
        const lastmod = source ? lastmodFor(source) : undefined;
        return { ...item, ...meta, ...(lastmod ? { lastmod } : {}) };
      },
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
          'chevron-right',
          'arrow-left',
          'badge-check',
          'briefcase',
          'calendar-days',
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
          'comptia',
          'cncf',
          'linuxfoundation',
          'linuxprofessionalinstitute',
          'credly',
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
  markdown: {
    // One dark theme: code blocks are dark in both site themes (Section 3.2 of the plan).
    // The background is pinned to the code-bg token in typography.css.
    shikiConfig: { theme: 'github-dark-default', wrap: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
