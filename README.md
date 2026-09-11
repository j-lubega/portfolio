# Portfolio Site

Astro (TypeScript, strict) + Tailwind CSS v4. Deploys to Vercel.

## Structure
- `src/data/profile.ts` — public-safe content extracted from resume (no email/phone/address), fully typed
- Pages: Home, Blog, Projects (index + Posit SSL, Linux hardening, and enterprise infrastructure case studies), Book a Call, Contact
- `src/layouts/BaseLayout.astro` — SEO/OG/Twitter meta, accessibility (skip link, semantic HTML)
- `src/layouts/ProjectLayout.astro` — typed frontmatter for Markdown case studies
- `vercel.json` — Vercel build config

## Before deploying
1. `src/data/profile.ts` → replace `social.linkedin` / `social.github` placeholders
2. `astro.config.mjs` → replace `site` with your real domain
3. Add `public/og-image.png` (1200×630)
4. The `/book` page links to the Calendly schedule at `https://calendly.com/jimmylubegapro/30min`; update that URL in `src/pages/book.astro` if your schedule changes

## Local dev
```bash
npm install
npm run dev       # http://localhost:4321
npm run check     # TypeScript check, 0 errors expected
npm run build     # outputs to dist/
npm run preview   # preview production build locally
```
