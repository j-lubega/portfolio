// Captures full-page screenshots of every route at phone and desktop widths.
// Usage: node scripts/baseline.mjs <baseUrl> <outDir>
// Requires a local Chrome install; uses playwright-core so no browser download is needed.
import { chromium } from 'playwright-core';
import { findChrome } from './chrome-path.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [base = 'http://localhost:4322', outDir = 'docs/baseline/screenshots'] =
  process.argv.slice(2);
// Current routes as of Phase 8. The original Phase 0 baseline (docs/baseline/2026-09-13) was
// captured against /blog and /contact, which have since been redirected away; that historical
// capture is not reproducible with this route list, by design, since those routes are gone.
const routes = [
  '/',
  '/about',
  '/education',
  '/projects',
  '/projects/posit-ssl',
  '/projects/linux-hardening-selinux',
  '/projects/enterprise-infrastructure-builds',
  '/book',
  '/connect',
];
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];
const executablePath = findChrome();

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '__');
    const file = join(outDir, `${slug}.${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log('saved', file);
  }
  await ctx.close();
}
await browser.close();
