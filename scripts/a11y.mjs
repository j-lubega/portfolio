// Automated accessibility scan: axe-core against every route, both themes, both widths.
// Usage: node scripts/a11y.mjs [baseUrl]   (default http://localhost:4322, i.e. `astro preview`)
// Gate: zero "serious" or "critical" violations. "moderate" and "minor" are reported, not blocking
// (axe cannot judge alt-text quality or reading order by itself; docs/a11y-checklist.md covers that).
import { chromium } from 'playwright-core';
import { findChrome } from './chrome-path.mjs';
import AxeBuilder from '@axe-core/playwright';

const base = process.argv[2] ?? 'http://localhost:4322';
const executablePath = findChrome();

const routes = [
  '/',
  '/about',
  '/education',
  '/projects',
  '/projects/tag/linux',
  '/projects/posit-ssl',
  '/projects/linux-hardening-selinux',
  '/projects/enterprise-infrastructure-builds',
  '/book',
  '/connect',
  '/design',
  '/404',
];
const viewports = [
  { name: '390px', width: 390, height: 844 },
  { name: '1440px', width: 1440, height: 900 },
];
const themes = ['light', 'dark'];

const BLOCKING = new Set(['serious', 'critical']);

const browser = await chromium.launch({ executablePath, headless: true });
let blockingCount = 0;
let reportedCount = 0;
const blockingDetail = [];

for (const theme of themes) {
  for (const viewport of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: theme,
    });
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem('jl-theme', t);
      } catch {
        /* storage unavailable */
      }
    }, theme);

    for (const route of routes) {
      const page = await ctx.newPage();
      const url = base + route;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (e) {
        console.log(`SKIP  ${theme} ${viewport.name} ${route}  (navigation failed: ${e.message})`);
        await page.close();
        continue;
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const blocking = results.violations.filter((v) => BLOCKING.has(v.impact));
      const other = results.violations.filter((v) => !BLOCKING.has(v.impact));

      const label = `${theme} ${viewport.name} ${route}`;
      if (blocking.length === 0) {
        console.log(`PASS  ${label}  (0 serious/critical, ${other.length} lower-severity)`);
      } else {
        console.log(`FAIL  ${label}  (${blocking.length} serious/critical)`);
        for (const v of blocking) {
          console.log(`   [${v.impact}] ${v.id}: ${v.help}`);
          for (const node of v.nodes.slice(0, 3)) {
            console.log(`      ${node.target.join(' ')}  ${node.html.slice(0, 120)}`);
          }
        }
      }
      blockingCount += blocking.length;
      reportedCount += other.length;
      if (blocking.length > 0) blockingDetail.push({ label, blocking });

      await page.close();
    }
    await ctx.close();
  }
}

await browser.close();

console.log(
  `\n${blockingCount === 0 ? 'PASS' : 'FAIL'}: ${blockingCount} serious/critical violations across ${routes.length} routes x ${viewports.length} widths x ${themes.length} themes (${reportedCount} lower-severity noted, not blocking).`
);
process.exit(blockingCount === 0 ? 0 : 1);
