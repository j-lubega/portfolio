import type { APIRoute } from 'astro';
import { site } from '../data/site';

/**
 * Generated from `site.url` (astro.config.mjs `site` uses the same value) so robots.txt and the
 * sitemap can never drift apart the way they did historically, when the production domain changed
 * four times in two days and robots.txt kept pointing at an old one.
 */
export const GET: APIRoute = ({ site: astroSite }) => {
  const base = (astroSite ?? new URL(site.url)).toString().replace(/\/$/, '');
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap-index.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
