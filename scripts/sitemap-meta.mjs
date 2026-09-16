// Maps a built sitemap URL back to the source file that produced it, so lastmod can come from
// that file's last git commit (falling back to its filesystem mtime for an uncommitted change,
// so a fresh edit is never reported with a stale date). changefreq and priority are static,
// reflecting how often each kind of page actually changes and how central it is to the site.
import { execSync } from 'node:child_process';
import { statSync, existsSync } from 'node:fs';
import { EnumChangefreq } from 'sitemap';

const SOURCE_BY_PATH = {
  '/': 'src/pages/index.astro',
  '/about/': 'src/pages/about.astro',
  '/education/': 'src/pages/education.astro',
  '/projects/': 'src/pages/projects/index.astro',
  '/book/': 'src/pages/book.astro',
  '/connect/': 'src/pages/connect.astro',
};

function projectSource(slug) {
  return `src/content/projects/${slug}.md`;
}

function tagPageSource() {
  return 'src/pages/projects/tag/[tag].astro';
}

/** Resolve a sitemap URL's pathname to the repo-relative file that generates it. */
export function sourceFileFor(pathname) {
  if (SOURCE_BY_PATH[pathname]) return SOURCE_BY_PATH[pathname];
  const projectMatch = pathname.match(/^\/projects\/([^/]+)\/$/);
  if (projectMatch && !['tag'].includes(projectMatch[1])) return projectSource(projectMatch[1]);
  if (pathname.startsWith('/projects/tag/')) return tagPageSource();
  return undefined;
}

function gitLastCommitIso(file) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${file}"`, { encoding: 'utf8' }).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

/** Last-modified ISO date for a source file: last git commit touching it, else its mtime. */
export function lastmodFor(file) {
  const committed = gitLastCommitIso(file);
  if (committed) return committed;
  if (existsSync(file)) return statSync(file).mtime.toISOString();
  return undefined;
}

/** changefreq/priority by URL shape; matches how often each kind of page actually changes. */
export function sitemapMeta(pathname) {
  if (pathname === '/') return { changefreq: EnumChangefreq.WEEKLY, priority: 1.0 };
  if (pathname === '/projects/') return { changefreq: EnumChangefreq.WEEKLY, priority: 0.9 };
  if (/^\/projects\/[^/]+\/$/.test(pathname) && !pathname.includes('/tag/')) {
    return { changefreq: EnumChangefreq.MONTHLY, priority: 0.8 };
  }
  if (pathname.startsWith('/projects/tag/')) {
    return { changefreq: EnumChangefreq.MONTHLY, priority: 0.4 };
  }
  if (pathname === '/book/') return { changefreq: EnumChangefreq.MONTHLY, priority: 0.8 };
  return { changefreq: EnumChangefreq.MONTHLY, priority: 0.6 };
}
