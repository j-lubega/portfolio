# Jimmy Lubega portfolio

Astro 7 (static output, TypeScript strict) + Tailwind CSS 4 + React 19 islands. Deploys to Vercel.

The improvement plan and source of truth for all build work is [`website-improvement.md`](./website-improvement.md). Work through it one phase at a time.

## Commands

```bash
npm install
npm run dev            # http://localhost:4321
npm run check          # astro check (TypeScript), 0 errors expected
npm run lint           # ESLint (astro, typescript, jsx-a11y)
npm run format         # Prettier (astro + tailwind class sorting); format:check in CI
npm run build          # outputs to dist/
npm run preview        # serve the production build locally
npm run baseline -- http://localhost:4321 docs/baseline/<date>/screenshots   # full-page screenshots of every route
```

CI (`.github/workflows/ci.yml`) runs `format:check`, `lint`, `check` and `build` on every pull request and on pushes to `main`.

## Structure

- `src/data/site.ts`: public-safe identity, links, Calendly URLs and resume-derived content (no email, phone or address). Fully typed.
- `src/styles/tokens.css`: the design tokens (light and dark palettes, radius, shadow, motion). `global.css` maps them into Tailwind.
- `src/components/ui/`: token-driven primitives (Button, Card, Tag, Eyebrow, SectionHeader, Section, Container, Icon, Stat, StatusPill).
- `src/scripts/theme.ts` and `theme-init.js`: the light/dark theme system (see below).
- `src/pages/design.astro`: the design-system review page (`/design`, noindex, excluded from the sitemap).
- `src/layouts/BaseLayout.astro`: SEO/OG/Twitter meta, JSON-LD, fonts, theme bootstrap, skip link.
- `src/layouts/ProjectLayout.astro`: frame for the Markdown case studies (replaced by a content collection in Phase 7).
- `docs/baseline/<date>/`: screenshots and Lighthouse reports captured before the redesign started.
- `vercel.json`: Vercel build config.

## Theme system

Precedence, highest first:

1. A manual choice stored in `localStorage["jl-theme"]` (`"light"` or `"dark"`), set by the light-bulb toggle. Persists until "Reset to automatic" in the footer clears it.
2. The operating system's dark preference (`prefers-color-scheme: dark`) forces dark.
3. Otherwise time of day: dark from 19:00 to 06:59 local time, light from 07:00 to 18:59.

The resolver runs inline in `<head>` before any stylesheet so the first paint is already correct, and re-runs on `astro:after-swap` so view transitions keep the theme. Tokens use CSS `light-dark()` driven by `color-scheme`, so with JavaScript disabled the site follows the OS preference automatically.

## Dependency decisions (Phase 0)

- **HeroUI: not used.** HeroUI v3 does support Tailwind 4, but its stylesheet takes over the Tailwind entry and layer order, it ships an opinionated house style (pill buttons, zinc neutrals) and its own theme selectors, and it requires the React Aria runtime. This site needs three or four small interactive pieces, so components are hand-rolled with Tailwind; Radix primitives may be added per component if a React island genuinely needs one.
- **Animation: `motion` only, no GSAP.** GSAP is free for commercial use, but nothing on this site needs pinning or scrubbed timelines. `motion` covers reveals, hover, the hero graphic and page transitions, and works in plain `.astro` scripts as well as React islands. If a later phase needs scroll-pinned storytelling, add GSAP for that island alone and document why.
- **ESLint is pinned to 9.x** with `eslint-plugin-astro` 1.x because `eslint-plugin-jsx-a11y` has not yet declared ESLint 10 support. Revisit when it does.

## Before deploying

1. `src/data/site.ts`: confirm social links and Calendly URLs.
2. `astro.config.mjs`: `site` is `https://jlpro-po.com`; the domain is registered and connected in Phase 13.
3. `public/og-image.png` is an interim 1200x630 placeholder; Phase 11 generates per-page images.
4. Calendly: the 30-minute event must be free and the 1-hour event must charge $100 (as of 2026-09-13 they are the other way round). Fix in Calendly before Phase 4 ships.

## Copy rules

No em-dashes anywhere: not in site copy, code comments, or commit messages. Use commas, colons, parentheses, or separate sentences.
