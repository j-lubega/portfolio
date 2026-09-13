/**
 * Theme system.
 *
 * Precedence, highest first:
 *   1. Manual choice in localStorage (set by the light-bulb toggle, cleared by "Reset to automatic").
 *   2. The OS dark preference (prefers-color-scheme: dark) forces dark.
 *   3. Time of day: dark from 19:00 to 06:59 local time, light otherwise.
 *
 * theme-init.js is a minimal inline copy of resolve + apply that runs in <head>
 * before first paint. Keep the two in sync when the rule changes.
 */
export type Theme = 'light' | 'dark';

export const STORAGE_KEY = 'jl-theme';
export const DARK_HOUR_START = 19;
export const DARK_HOUR_END = 7;

const THEME_COLOR: Record<Theme, string> = { light: '#f7f8fa', dark: '#0b1220' };

export function getManualTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function timeOfDayTheme(date: Date = new Date()): Theme {
  const hour = date.getHours();
  return hour >= DARK_HOUR_START || hour < DARK_HOUR_END ? 'dark' : 'light';
}

export function resolveTheme(): Theme {
  return getManualTheme() ?? (systemPrefersDark() ? 'dark' : timeOfDayTheme());
}

/** The theme currently painted, falling back to the resolver if the attribute is missing. */
export function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' || attr === 'light' ? attr : resolveTheme();
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function applyTheme(theme: Theme, options: { animate?: boolean } = {}): void {
  const root = document.documentElement;
  if (options.animate && !reducedMotion() && root.getAttribute('data-theme') !== theme) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 320);
  }
  root.setAttribute('data-theme', theme);
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => (meta.content = THEME_COLOR[theme]));
  window.dispatchEvent(
    new CustomEvent('jl:themechange', { detail: { theme, manual: getManualTheme() !== null } })
  );
}

export function setManualTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode or storage disabled: the choice lasts for this page only.
  }
  applyTheme(theme, { animate: true });
}

export function clearManualTheme(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored; nothing to clear.
  }
  applyTheme(resolveTheme(), { animate: true });
}

export function toggleTheme(): void {
  setManualTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

let synced = false;

/**
 * Keeps the painted theme in step with the outside world:
 * OS preference changes, another tab changing the manual choice, view
 * transitions replacing <html> attributes, and the clock crossing 07:00 or 19:00.
 * Safe to call more than once.
 */
export function initThemeSync(): void {
  if (synced) return;
  synced = true;

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => applyTheme(resolveTheme(), { animate: true }));

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) applyTheme(resolveTheme());
  });

  document.addEventListener('astro:after-swap', () => applyTheme(resolveTheme()));

  window.setInterval(() => {
    if (getManualTheme() || systemPrefersDark()) return;
    const next = timeOfDayTheme();
    if (next !== currentTheme()) applyTheme(next, { animate: true });
  }, 60_000);
}
