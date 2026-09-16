/**
 * Scroll reveal: elements marked data-reveal fade and lift into place the first time they enter
 * the viewport, once. A data-reveal-group staggers its direct children (60ms apart, 6 max) instead
 * of revealing itself. All the actual animation is CSS (transform/opacity only, so it stays off
 * the main thread and skips prefers-reduced-motion automatically via global.css); this module only
 * decides *when* to add the class.
 *
 * Re-run on astro:page-load (new elements after a view transition) and disconnect observers on
 * astro:before-swap so they do not accumulate across navigations.
 */
import { inView } from 'motion';

const REVEALED = 'is-revealed';
const STAGGER_MS = 60;
const STAGGER_MAX = 6;

let stopObserving: (() => void) | null = null;

function reveal(el: Element, delay = 0): void {
  if (delay === 0) {
    el.classList.add(REVEALED);
    return;
  }
  window.setTimeout(() => el.classList.add(REVEALED), delay);
}

export function initReveal(root: ParentNode = document): void {
  stopObserving?.();

  const targets = new Set<Element>();
  root.querySelectorAll('[data-reveal]').forEach((el) => targets.add(el));
  root.querySelectorAll('[data-reveal-group]').forEach((group) => {
    [...group.children].slice(0, STAGGER_MAX).forEach((child) => targets.add(child));
  });

  if (targets.size === 0) {
    stopObserving = null;
    return;
  }

  stopObserving = inView(
    [...targets],
    (el) => {
      const group = el.closest('[data-reveal-group]');
      const index = group ? [...group.children].indexOf(el) : 0;
      reveal(el, Math.min(index, STAGGER_MAX - 1) * STAGGER_MS);
    },
    { amount: 0.2, margin: '0px 0px -10% 0px' }
  );
}

export function stopReveal(): void {
  stopObserving?.();
  stopObserving = null;
}

if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', () => initReveal());
  document.addEventListener('astro:before-swap', stopReveal);
  initReveal();
}
