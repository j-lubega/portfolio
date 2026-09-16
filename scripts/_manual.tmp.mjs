import { chromium } from 'playwright-core';
import { findChrome } from './chrome-path.mjs';
const browser = await chromium.launch({ executablePath: findChrome(), headless: true });
const routes = [
  '/',
  '/about',
  '/education',
  '/projects',
  '/projects/posit-ssl',
  '/book',
  '/connect',
];

console.log('=== 320px reflow (no horizontal scroll) ===');
{
  const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
  const page = await ctx.newPage();
  for (const r of routes) {
    await page.goto('http://localhost:4322' + r, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    console.log(
      `${overflow ? 'FAIL' : 'PASS'}  ${r}  scrollWidth=${await page.evaluate(() => document.documentElement.scrollWidth)} clientWidth=${await page.evaluate(() => document.documentElement.clientWidth)}`
    );
  }
  await ctx.close();
}

console.log('\n=== 200% zoom (emulated: half viewport, same content) ===');
{
  // Chromium page zoom isn't directly exposed via playwright-core's public API; emulate the
  // reflow effect of 200% zoom by halving the viewport (same CSS-pixel content, half the room),
  // which is what 200% zoom does to available layout space at a fixed 1280 window.
  const ctx = await browser.newContext({ viewport: { width: 640, height: 450 } });
  const page = await ctx.newPage();
  for (const r of routes) {
    await page.goto('http://localhost:4322' + r, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    console.log(`${overflow ? 'FAIL' : 'PASS'}  ${r}  (640px effective width)`);
  }
  await ctx.close();
}

console.log('\n=== forced-colors: active (Windows High Contrast emulation) ===');
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    forcedColors: 'active',
  });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4322/', { waitUntil: 'networkidle' });
  const toggle = await page.evaluate(() => {
    const btn = document.querySelector('[data-theme-toggle]');
    const cs = getComputedStyle(btn);
    return {
      border: cs.borderStyle + ' ' + cs.borderWidth,
      visible: btn.getBoundingClientRect().width > 0,
    };
  });
  console.log('theme toggle under forced-colors:', JSON.stringify(toggle));
  await page.goto('http://localhost:4322/projects', { waitUntil: 'networkidle' });
  const card = await page.evaluate(() => {
    const a = document.querySelector('a.project-card');
    const cs = getComputedStyle(a);
    const h3 = a.querySelector('h3');
    return {
      cardBorder: cs.borderStyle,
      titleVisible: h3 && getComputedStyle(h3).color !== 'rgba(0, 0, 0, 0)',
      titleText: h3?.textContent.trim().slice(0, 30),
    };
  });
  console.log('project card under forced-colors:', JSON.stringify(card));
  await page.screenshot({
    path: process.env.TEMP + '/p11/forced-colors-home.png',
    fullPage: false,
  });
  await ctx.close();
}

console.log('\n=== accessibility tree spot check (proxy for screen reader) ===');
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  for (const r of ['/', '/book']) {
    await page.goto('http://localhost:4322' + r, { waitUntil: 'networkidle' });
    const snapshot = await page.accessibility.snapshot();
    const countRoles = (node, acc = {}) => {
      if (!node) return acc;
      acc[node.role] = (acc[node.role] || 0) + 1;
      (node.children || []).forEach((c) => countRoles(c, acc));
      return acc;
    };
    const roles = countRoles(snapshot);
    console.log(
      `${r}: heading=${roles.heading || 0} link=${roles.link || 0} button=${roles.button || 0} landmark(banner/main/contentinfo/navigation)=${(roles.banner || 0) + (roles.main || 0) + (roles.contentinfo || 0) + (roles.navigation || 0)}`
    );
  }
  await ctx.close();
}
await browser.close();
