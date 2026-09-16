/**
 * Counts a stat from 0 up to its target value once, the first time it scrolls into view.
 * Targets are marked data-count-up="<final text>" (Stat.astro's countUp prop); the final text is
 * always what is already in the DOM, so no-JS visitors and reduced-motion both just see the
 * finished number, never a stuck 0. Digits use tabular numerals (Stat.astro's .tabular class), so
 * the width never jitters while counting.
 *
 * Mirrors reveal.ts: same inView trigger, same astro:page-load / astro:before-swap lifecycle, so
 * observers do not accumulate across view-transition navigations.
 */
import { inView } from 'motion';

const DURATION_MS = 1400;
const STAGGER_MS = 80;
// Decelerating curve: fast start, settles in gently at the end. Reads as "sleek", not mechanical.
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Splits "2,000+" into a leading run of digits (with any comma grouping) plus its wrapper text. */
function parseTarget(text: string): { prefix: string; digits: number; suffix: string } | null {
  const match = text.match(/^(\D*)([\d,]+)(\D*)$/);
  if (!match) return null;
  const [, prefix, grouped, suffix] = match;
  return { prefix, digits: Number(grouped.replace(/,/g, '')), suffix };
}

function animate(el: HTMLElement, target: { prefix: string; digits: number; suffix: string }) {
  const start = performance.now();
  const format = (n: number) => `${target.prefix}${n.toLocaleString('en-US')}${target.suffix}`;

  function frame(now: number) {
    const progress = Math.min((now - start) / DURATION_MS, 1);
    // Math.max also guards against -0: a near-zero floating-point artifact at very low progress
    // rounds to -0, and (-0).toLocaleString() prints "-0", a one-frame glitch without this clamp.
    const current = Math.max(0, Math.round(target.digits * easeOutExpo(progress)));
    el.textContent = format(current);
    if (progress < 1) requestAnimationFrame(frame);
    else el.textContent = format(target.digits); // exact final text, no rounding drift
  }
  requestAnimationFrame(frame);
}

let stopObserving: (() => void) | null = null;

export function initCountUp(root: ParentNode = document): void {
  stopObserving?.();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = [...root.querySelectorAll<HTMLElement>('[data-count-up]')];
  if (targets.length === 0 || reduced) {
    stopObserving = null;
    return; // Reduced motion: leave the server-rendered final value exactly as it is.
  }

  stopObserving = inView(
    targets,
    (target) => {
      // inView types its callback element as the DOM-generic Element; these all came from
      // querySelectorAll<HTMLElement> above, so the cast is just restoring what we already know.
      const el = target as HTMLElement;
      const parsed = parseTarget(el.dataset.countUp ?? '');
      if (!parsed) return; // Unrecognized format: leave the final text alone, count nothing.
      const index = targets.indexOf(el);
      el.textContent = parsed.prefix + '0' + parsed.suffix;
      window.setTimeout(() => animate(el, parsed), index * STAGGER_MS);
    },
    { amount: 0.4 }
  );
}

if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', () => initCountUp());
  document.addEventListener('astro:before-swap', () => stopObserving?.());
  initCountUp();
}
