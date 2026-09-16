# Accessibility manual pass

Tester: Claude (Sonnet 5), on behalf of the developer. Date: 2026-09-16. Build: preview build of
the working tree described in `website-improvement.md` Phase 11.

This environment has no interactive desktop, so items that need a human sitting at a real screen
reader or a real zoomed browser window are marked **automated proxy** below: a scripted check that
verifies the same underlying property, run through Playwright driving headless Chrome, rather than
a person doing it by hand. Every proxy result includes exactly what was run so it can be spot-checked
by hand in five minutes. Nothing here claims a human keyboard or screen-reader session took place
where it didn't.

## Automated pass (not manual, but the prerequisite for it)

`npm run a11y:check` (axe-core via `@axe-core/playwright`): 12 routes x 2 viewports (390px, 1440px)
x 2 themes = 48 combinations, 0 serious or critical violations, 0 of any severity. Full output is
reproducible; not re-pasted here.

## 1. Keyboard-only walkthrough

**Method:** Playwright's keyboard API (`page.keyboard.press`) driving real Tab/Enter/Space/Escape
key events through Chromium's actual input pipeline, not simulated DOM events. This exercises the
same code path a human pressing keys would, but a human should still confirm the _feel_ of it
(timing, whether anything looks wrong that a computed-style assertion wouldn't catch).

Verified, and encoded as permanent regression checks in `scripts/site-check.mjs` and
`scripts/theme-check.mjs` (re-run any time with `npm run site:check` / `npm run theme:check`):

- Tab reaches the skip link first on every page; activating it moves focus to `#main-content`.
- Every header and footer control (nav links, the theme toggle, the mobile menu button, footer
  links, the theme reset button) shows a 2px solid focus ring when focused.
- The theme toggle responds to both Enter and Space, matches the native button pattern.
- The mobile menu: opens on click, focus moves inside the dialog (native `<dialog>` focus trap),
  Esc closes it and returns focus to the button that opened it, clicking a link inside closes it
  and navigates.
- Every credential and timeline `<details>` opens on Enter/Space with focus on its `<summary>`.
- Client-side navigation moves focus to the destination page's `<h1>`, unless the link carries a
  hash fragment, in which case the hash target is left to receive the browser's normal scroll
  behavior instead (both paths verified: About and `/#book`).

**Not automated, left for a human:** tabbing through an entire page start to finish in one session
and confirming the order _feels_ right (as opposed to each stop being individually correct, which
is what the above checks). Recommended: five minutes on Home, `/book`, and one case study.

## 2. Screen reader spot check

**Automated proxy:** Playwright's `locator.ariaSnapshot()`, which renders the same accessibility
tree a screen reader consumes (computed roles, accessible names, and states, via Chromium's own
accessibility engine, not a guess from the DOM). Full trees for Home, `/book`, and the `posit-ssl`
case study are saved in `docs/aria-snapshots.txt`. This is a real assistive-technology-adjacent
signal, not a DOM dump, but it is not the same as hearing NVDA actually speak the page, which can
surface phrasing and pacing issues a tree diff cannot.

Spot-checked in the saved trees:

- Landmarks present and correctly labeled: `banner`, `navigation "Primary"`, `main`,
  `contentinfo`, one each per page.
- Every link's accessible name is self-sufficient out of context ("Jimmy Lubega on LinkedIn (opens
  in a new tab)", not "click here"); external links consistently carry the "(opens in a new tab)"
  suffix.
- The topology SVG exposes as `img` with a full descriptive name ("Diagram: a Kubernetes platform
  connected to AWS, Azure, Linux, infrastructure as code and observability."), not as a wall of
  unlabeled paths.
- Lists read as lists (stack tags, bullets, nav items), not as unmarked runs of text.
- Heading levels in the tree match what `npm run site:check`'s headings audit checks separately
  (one h1, no skipped level).

**Not automated, left for a human:** an actual NVDA (or JAWS/VoiceOver) session on Home, the Book a
Call flow, and one case study, listening for anything that reads awkwardly, is announced twice, or
is announced in a confusing order despite a technically-correct tree. Recommended before launch.

## 3. 200% zoom and 320px reflow

**320px reflow, direct test:** real 320px viewport (the WCAG 1.4.10 reference width), 7 key routes.
No horizontal scroll on any of them (`scrollWidth === clientWidth` in every case):

```
PASS  /                    scrollWidth=320 clientWidth=320
PASS  /about               scrollWidth=320 clientWidth=320
PASS  /education           scrollWidth=320 clientWidth=320
PASS  /projects            scrollWidth=320 clientWidth=320
PASS  /projects/posit-ssl  scrollWidth=320 clientWidth=320
PASS  /book                scrollWidth=320 clientWidth=320
PASS  /connect             scrollWidth=320 clientWidth=320
```

**200% zoom, automated proxy:** Chromium page zoom isn't exposed through `playwright-core`'s public
API, so this used the same reflow effect zoom produces: halving the available layout width (640px,
simulating 200% zoom in a 1280px window) and checking for horizontal scroll. All 7 routes passed
with no overflow. This proxy checks the same CSS reflow behavior real zoom triggers, but a human
should still zoom an actual browser window to 200% and confirm nothing is clipped, overlapping, or
unreadable in a way a scrollWidth check wouldn't catch (for example, truncated text with no
indication more exists).

## 4. Forced-colors mode (Windows High Contrast)

**Method:** Chromium's `forcedColors: 'active'` context emulation, which applies the same
forced-colors CSS media query and system color keywords (`ButtonText`, `LinkText`, `Canvas`, and
so on) that real Windows High Contrast triggers in Chromium and Edge. Screenshots saved at
`docs/screenshots/forced-colors-home.png` and `docs/screenshots/forced-colors-projects.png`.

- Theme toggle: kept a visible `solid 1px` border (the explicit `forced-color-adjust: none` rule in
  `global.css` for `.theme-toggle`), stayed clickable and visible.
- Project cards: Chromium auto-applied visible borders to the cards and tags beyond what this
  project's CSS specifies, and the title text rendered in the system `LinkText` color
  (`rgb(0, 0, 159)` in this test environment), fully legible against the forced background. Full
  page screenshot showed every card, tag, and status pill with a clear boundary, nothing invisible.

**Not automated, left for a human:** actual Windows Settings > High Contrast (not just the browser
emulation) on a Windows machine, since Windows-level theme choices can interact with the browser
differently than Chromium's isolated emulation. Recommended as a final check, low risk given the
emulated result above.

## 5. Contrast (re-verified against Phase 1)

`/design` measures every token pair live from computed colors (not just at authoring time) and
prints the ratio next to each swatch. All 17 documented pairs still pass WCAG AA in both themes as
of this build; lowest margins unchanged since Phase 1 (`fg-faint` on `surface` in dark at 4.71:1,
`ok` on `canvas` in light at 4.72:1, both comfortably over the 4.5:1 floor for body text). No token
value changed between Phase 1 and Phase 11, so no regression was possible, but the live measurement
was re-run rather than assumed.

## Summary

| Item                                                     | Status                                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Automated accessibility scan (axe-core, 48 combinations) | Done, 0 violations                                                                                           |
| Keyboard-only walkthrough                                | Automated proxy done; human confirmation recommended, not required                                           |
| Screen reader spot check                                 | Automated proxy done (`docs/aria-snapshots.txt`); live NVDA/JAWS/VoiceOver session recommended before launch |
| 320px reflow                                             | Done, real viewport test                                                                                     |
| 200% zoom                                                | Automated proxy done; live browser zoom recommended, not required                                            |
| Forced-colors / High Contrast                            | Automated proxy done (Chromium emulation); real Windows High Contrast recommended, not required              |
| Contrast re-verification                                 | Done, live measurement on `/design`                                                                          |

Nothing marked "recommended" blocks the acceptance criteria in `website-improvement.md`, which asks
for this checklist to be completed and committed; all six items were run in some verifiable form.
The three "automated proxy... recommended" rows are the honest gap between what this session could
run without a human at a real keyboard, screen reader, or Windows machine, and what a final launch
check should still include.
