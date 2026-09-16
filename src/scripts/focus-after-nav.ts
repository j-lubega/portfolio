/**
 * Screen reader users get no cue that navigation happened after a client-side route swap: the
 * header persists, only <main> changes, and nothing moves focus on its own (Astro's ClientRouter
 * only restores focus for elements inside a transition:persist block, which the new page's content
 * never is). After a swap with no URL fragment, move focus to the page's h1 so its announcement
 * doubles as the "you are here now" cue; a fragment (for example the Home page's #book anchor)
 * is left alone so the browser's own hash-scroll behavior is not fought.
 *
 * astro:after-swap (not astro:page-load) because it only fires on client-side navigations, never
 * on the very first full page load, where this would be redundant.
 */
function focusMainHeading(): void {
  if (location.hash) return;
  const heading = document.querySelector<HTMLElement>('#main-content h1');
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}

document.addEventListener('astro:after-swap', focusMainHeading);
