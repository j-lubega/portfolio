// Behavioral checks for the theme system (Phase 2 acceptance criteria).
// Usage: node scripts/theme-check.mjs [baseUrl]   (default http://localhost:4322, i.e. `astro preview`)
// Requires a local Chrome install; uses playwright-core.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:4322';
const chromePaths = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const executablePath = process.env.CHROME_PATH ?? chromePaths.find((p) => existsSync(p));
if (!executablePath) throw new Error('Chrome not found; set CHROME_PATH');

const DARK = 'rgb(11, 18, 32)';
const LIGHT = 'rgb(247, 248, 250)';

const browser = await chromium.launch({ executablePath, headless: true });
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};
const attr = (page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

async function ctxWith({
  colorScheme = 'light',
  hour,
  stored,
  reducedMotion = 'no-preference',
  js = true,
} = {}) {
  const ctx = await browser.newContext({
    colorScheme,
    reducedMotion,
    javaScriptEnabled: js,
    viewport: { width: 1200, height: 800 },
  });
  await ctx.addInitScript(
    ({ hour, stored }) => {
      // Seed storage once per tab; reloads and route changes must see what the site stored.
      try {
        if (!sessionStorage.getItem('__seeded')) {
          localStorage.clear();
          if (stored) localStorage.setItem('jl-theme', stored);
          sessionStorage.setItem('__seeded', '1');
        }
      } catch {
        /* storage unavailable */
      }
      if (hour !== undefined) {
        Date.prototype.getHours = function () {
          return hour;
        };
      }
      document.addEventListener('DOMContentLoaded', () => {
        window.__atDCL = document.documentElement.getAttribute('data-theme');
      });
    },
    { hour, stored }
  );
  return ctx;
}

// 1. Precedence: manual > OS dark > time of day
const cases = [
  ['OS dark, 10:00, no manual: dark', { colorScheme: 'dark', hour: 10 }, 'dark'],
  ['OS light, 10:00, no manual: light', { colorScheme: 'light', hour: 10 }, 'light'],
  ['OS light, 20:00, no manual: dark (time of day)', { colorScheme: 'light', hour: 20 }, 'dark'],
  ['OS light, 06:00, no manual: dark (time of day)', { colorScheme: 'light', hour: 6 }, 'dark'],
  ['OS light, 07:00, no manual: light', { colorScheme: 'light', hour: 7 }, 'light'],
  ['OS dark, manual light: light', { colorScheme: 'dark', hour: 22, stored: 'light' }, 'light'],
  [
    'OS light, 12:00, manual dark: dark',
    { colorScheme: 'light', hour: 12, stored: 'dark' },
    'dark',
  ],
];
for (const [label, opts, expect] of cases) {
  const ctx = await ctxWith(opts);
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  const atDCL = await page.evaluate(() => window.__atDCL);
  const now = await attr(page);
  check(label, now === expect && atDCL === expect, `attr=${now} atDOMContentLoaded=${atDCL}`);
  await ctx.close();
}

// 2. No flash: attribute already set at DOMContentLoaded and first computed background matches
{
  const ctx = await ctxWith({ colorScheme: 'light', stored: 'dark' });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  const b = await bg(page);
  check(
    'stored dark on OS light: first computed body background is the dark canvas',
    b === DARK,
    b
  );
  const cls = await page.evaluate(() => document.documentElement.className);
  check(
    'no theme-transition class on initial load',
    !cls.includes('theme-transition'),
    cls || 'none'
  );
  await ctx.close();
}

// 3. Toggle, persistence, reset
{
  const ctx = await ctxWith({ colorScheme: 'light', hour: 12 });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const btn = page.locator('[data-theme-toggle]').first();
  check(
    'toggle present, aria-pressed=false in light',
    (await btn.getAttribute('aria-pressed')) === 'false'
  );
  const t0 = Date.now();
  await btn.click();
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const dt = Date.now() - t0;
  check('click flips to dark within 300ms', dt < 300, `${dt}ms`);
  check(
    'aria-pressed=true after toggling to dark',
    (await btn.getAttribute('aria-pressed')) === 'true'
  );
  check(
    'manual choice stored',
    (await page.evaluate(() => localStorage.getItem('jl-theme'))) === 'dark'
  );
  await page.waitForTimeout(400);
  const stillTransitioning = await page.evaluate(() =>
    document.documentElement.classList.contains('theme-transition')
  );
  check('theme-transition class removed after the transition', !stillTransitioning);
  await page.reload({ waitUntil: 'domcontentloaded' });
  check('persists across reload', (await attr(page)) === 'dark');
  await page.goto(base + '/projects/posit-ssl', { waitUntil: 'domcontentloaded' });
  check('persists across routes', (await attr(page)) === 'dark');
  const reset = page.locator('[data-theme-reset]').first();
  check('reset control visible when a manual choice exists', await reset.isVisible());
  await reset.click();
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  const key = await page.evaluate(() => localStorage.getItem('jl-theme'));
  check('reset clears the key and returns to automatic (light at 12:00)', key === null);
  check('reset control hidden again', !(await reset.isVisible()));
  await ctx.close();
}

// 4. Keyboard and accessible name
{
  const ctx = await ctxWith({ colorScheme: 'light', hour: 12 });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.locator('[data-theme-toggle]').first().focus();
  const ring = await page.evaluate(() => {
    const cs = getComputedStyle(document.activeElement);
    return `${cs.outlineStyle} ${cs.outlineWidth}`;
  });
  check('focused toggle shows a 2px solid focus ring', ring === 'solid 2px', ring);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
  check('Enter toggles', true);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  check('Space toggles back', true);
  const name = await page.evaluate(() => document.activeElement.getAttribute('aria-label'));
  check('accessible name is stable; aria-pressed carries the state', name === 'Dark mode', name);
  await ctx.close();
}

// 5. JavaScript disabled: OS preference through CSS light-dark(), toggle hidden
{
  const ctx = await ctxWith({ colorScheme: 'dark', js: false });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'load' });
  const b = await bg(page);
  check('no JS + OS dark: dark canvas from CSS alone', b === DARK, b);
  const hidden = await page.evaluate(
    () => getComputedStyle(document.querySelector('[data-theme-toggle]')).display === 'none'
  );
  check('no JS: toggle hidden via noscript', hidden);
  await ctx.close();
  const ctx2 = await ctxWith({ colorScheme: 'light', js: false });
  const page2 = await ctx2.newPage();
  await page2.goto(base + '/', { waitUntil: 'load' });
  const b2 = await bg(page2);
  check('no JS + OS light: light canvas from CSS alone', b2 === LIGHT, b2);
  await ctx2.close();
}

// 6. Reduced motion: toggle swaps instantly, no transition class
{
  const ctx = await ctxWith({ colorScheme: 'light', hour: 12, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  let sawClass = false;
  await page.exposeFunction('__saw', () => {
    sawClass = true;
  });
  await page.evaluate(() =>
    new MutationObserver(() => {
      if (document.documentElement.classList.contains('theme-transition')) window.__saw();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  );
  await page.locator('[data-theme-toggle]').first().click();
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
  await page.waitForTimeout(100);
  check('reduced motion: theme swaps with no transition class', !sawClass);
  await ctx.close();
}

// 7. Console clean on every route in both themes
for (const scheme of ['light', 'dark']) {
  const ctx = await ctxWith({ colorScheme: scheme });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  for (const r of [
    '/',
    '/blog',
    '/projects',
    '/projects/posit-ssl',
    '/book',
    '/contact',
    '/design',
  ]) {
    await page.goto(base + r, { waitUntil: 'networkidle' });
  }
  check(
    `console clean across routes (${scheme})`,
    errors.length === 0,
    errors.join(' | ').slice(0, 200)
  );
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
