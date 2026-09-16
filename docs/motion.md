# Motion

The rule from `website-improvement.md` Section 3.5: motion confirms state changes and reveals
structure, it does not decorate. Everything below is either a CSS token in
[`src/styles/global.css`](../src/styles/global.css) / [`tokens.css`](../src/styles/tokens.css), or
one small script.

## Tokens

| Token           | Value                         | Used for                                       |
| --------------- | ----------------------------- | ---------------------------------------------- |
| `--dur-fast`    | 150ms                         | Hover, focus, link underline fade              |
| `--dur-base`    | 250ms                         | Theme transition, bulb glow, page crossfade    |
| `--dur-slow`    | 450ms                         | Scroll reveal, card image hover zoom           |
| `--ease-out`    | `cubic-bezier(0.16,1,0.3,1)`  | Almost everything: settles, never overshoots   |
| `--ease-in-out` | `cubic-bezier(0.65,0,0.35,1)` | Reserved for anything symmetric (unused today) |

No bounce, no elastic easing, anywhere.

## What animates

| What                   | Where                                                                                                                                                                                                                  | How                                                                                                                                                                                                                                                                                                                                                                                                     | Duration                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Section reveal         | Section headers, project/credential/timeline/stat grids                                                                                                                                                                | `[data-reveal]` fades and lifts 12px in once, on first scroll into view; `[data-reveal-group]` staggers its direct children 60ms apart, up to 6                                                                                                                                                                                                                                                         | 450ms, `--ease-out`                  |
| Hover / focus feedback | Buttons (background + 1px press on `:active`), interactive cards (border to `line-strong` + shadow), project cards (image scales 1.03x, scrim opacity 0.94), links (`.link-underline`: text-decoration-color fades in) | CSS transitions on `transform`/`opacity`/`color`/`border-color` only                                                                                                                                                                                                                                                                                                                                    | 150ms                                |
| Theme switch           | Whole page, on toggle click                                                                                                                                                                                            | `.theme-transition` class added to `<html>` for ~320ms, transitions `background-color`, `color`, `border-color`, `fill`, `stroke` (covers the bulb SVG and the topology diagram)                                                                                                                                                                                                                        | 250ms                                |
| Page navigation        | Every route change                                                                                                                                                                                                     | Astro `ClientRouter`, built-in `fade`; header and theme toggle persist (`transition:persist`), so only `<main>` crossfades                                                                                                                                                                                                                                                                              | 200ms                                |
| Project cover morph    | Project card to case-study header                                                                                                                                                                                      | Matching `transition:name="project-cover-<id>"` on the image (or the dotted-grid fallback) in both `ProjectCard.astro` and `CaseStudyHeader.astro`; the browser's View Transitions API morphs position and size automatically. Falls back to the plain 200ms crossfade in browsers without View Transitions support, or when the id does not match (which cannot happen: the id is the collection slug) | Browser-driven, no explicit duration |
| Light-bulb toggle      | `ThemeToggle.astro`                                                                                                                                                                                                    | Filament and glow opacity ramp with the theme transition above; a 6 degree tilt on `:active` (mouse/touch press)                                                                                                                                                                                                                                                                                        | 250ms glow, instant tilt             |
| Hero role line         | Home only                                                                                                                                                                                                              | CSS `steps()` typing on two mono lines (1.1s then 0.8s, second line starts at 1.2s), cursor blinks 4 times starting at 1.9s (0.7s each, done by 4.7s) then stops for good. Final text is in the HTML from the start; a screen reader gets it immediately, never the typing animation                                                                                                                    | 1.1s / 0.8s / 4 x 0.7s               |
| Topology packet pulses | Home hero diagram                                                                                                                                                                                                      | SVG `<animateMotion>` along each edge path, 8 to 14s loops, `repeatCount="indefinite"`                                                                                                                                                                                                                                                                                                                  | Continuous, low contrast             |
| Proof strip count-up   | Home only, the four numbers under the hero (`ProofStrip.astro`)                                                                                                                                                        | `src/scripts/count-up.ts`: each `[data-count-up]` counts from 0 to its target once, the first time it scrolls into view, staggered 80ms apart; an `easeOutExpo` curve (fast start, settles in gently) rather than a linear tick-up. The server-rendered text is always the real final value; the script only rewrites it while animating                                                                | 1.4s, `easeOutExpo`, 80ms stagger    |

## What never animates

- Tags and stack chips: static, always. Motion on forty small labels reads as noise, not information.
- Headings, after their one reveal: no idle motion, no looping.
- Backgrounds, gradients, blobs: none exist. There is nothing to animate.
- The nav, the footer: static except the hover states above.
- Anything with `animation-iteration-count: infinite` except the topology pulses (a background detail,
  low contrast, expected to loop the way a status indicator loops) and, implicitly, nothing else. A
  repo-wide `grep -rn "infinite\|animate-pulse\|animate-spin" src` returns nothing outside those two
  legitimate cases (confirmed 2026-09-15; re-run this grep after adding any new component).

## `prefers-reduced-motion`

Three layers, so reduced motion is honored even if one of them is bypassed:

1. **Global CSS** (`global.css`): under `@media (prefers-reduced-motion: reduce)`, every
   `animation-duration` and `transition-duration` collapses to `0.01ms` and `scroll-behavior`
   becomes `auto`. This alone silences the theme transition, hover transitions, page crossfade and
   the reveal transition.
2. **Component-level overrides** for animations that need to _skip_, not just shorten, because a
   near-zero duration would still show a flash of the wrong state: the role line's `steps()` typing
   becomes `animation: none` (full text renders immediately) and the cursor is `display: none`; the
   topology's `.topology-pulses` group is `display: none`.
3. **Most JavaScript is not gated by `matchMedia('(prefers-reduced-motion)')`** because most of the
   motion in this site is JavaScript-driven only in the sense that a script adds or removes a class;
   the actual animation (or its absence) is entirely CSS, so the two layers above already cover it.
   `reveal.ts` is like this.
4. **The one exception, gated explicitly:** `count-up.ts` writes a new number to the DOM on every
   animation frame, which no CSS duration can intercept or stop (there is no CSS property changing,
   just text). It checks `matchMedia('(prefers-reduced-motion: reduce)')` itself and, when true,
   never starts: the element keeps whatever the server rendered, which is already the final value.

Verified: with Chrome's "Emulate CSS media feature prefers-reduced-motion: reduce" on, a full walk
through every route shows zero animation and zero transition, only instant state changes,
confirmed by `theme-check.mjs` (the toggle swaps with no transition class), by a dedicated check in
`count-up.ts`'s own test run (the proof-strip numbers are the exact target values immediately after
scrolling into view, never a 0 or a mid-count number), and by manual inspection of Home (role line
complete text, no cursor, static topology) and the projects index (cards appear immediately, no
stagger).

## Progressive enhancement

`[data-reveal]` and `[data-reveal-group]` elements only start hidden once `html.has-js` is present,
a class the inline theme bootstrap (`theme-init.js`) adds before first paint. A visitor with
JavaScript disabled or blocked never has `has-js`, so `opacity: 0` never applies and every reveal
target is visible immediately, full content, no motion, no dependency on a script that did not run.

`[data-count-up]` needs no such gate: it never hides anything. The server-rendered text is already
the real final number ("400+", not "0"); `count-up.ts` only ever rewrites that text if it runs, so
a visitor without JavaScript simply sees the finished number from the first paint, the same as
everyone else does once the count finishes.

## Budget

`reveal.ts`, `focus-after-nav.ts` and `count-up.ts` are imported together in `BaseLayout.astro`, so
Astro bundles and inlines all three into every page's HTML as one block: 2,542 bytes raw, 1,184
bytes gzip combined, alongside the theme-reset and theme-toggle wiring. `count-up.ts` only ever
does anything on Home, where `[data-count-up]` exists; everywhere else its `querySelectorAll` finds
nothing and it returns immediately, effectively free at runtime, but its code still ships on every
page since the three scripts are bundled as one unit. Total JS per route, `npm run site:check`:

| Route        | Gzip                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| `/` (Home)   | 8.5 KB (limit 25 KB): `ClientRouter` 5.4K, theme 0.8K, toggle 0.3K, footer 0.2K, inline bundle 1.8K |
| `/about`     | 8.1 KB: same shell, inline bundle 1.4K (no role-line or topology markup on the page to observe)     |
| A case study | 8.3 KB: same shell, inline bundle 1.6K, plus the copy-button script on code blocks (371 bytes gzip) |

No page loads the React runtime (`@astrojs/react` stays installed for future islands that
genuinely need state; nothing today does).
