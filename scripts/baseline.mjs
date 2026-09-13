// Captures full-page screenshots of every route at phone and desktop widths.
// Usage: node scripts/baseline.mjs <baseUrl> <outDir>
// Requires a local Chrome install; uses playwright-core so no browser download is needed.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [base = 'http://localhost:4322', outDir = 'docs/baseline/screenshots'] =
  process.argv.slice(2);
const routes = [
  '/',
  '/blog',
  '/projects',
  '/projects/posit-ssl',
  '/projects/linux-hardening-selinux',
  '/projects/enterprise-infrastructure-builds',
  '/book',
  '/contact',
];
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];
const chromePaths = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const { existsSync } = await import('node:fs');
const executablePath = process.env.CHROME_PATH ?? chromePaths.find((p) => existsSync(p));
if (!executablePath) throw new Error('Chrome not found; set CHROME_PATH');

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
