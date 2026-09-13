# Website Improvement Plan: jlpro tech portfolio

| Field               | Value                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| Repository          | `jlpro-io/tech-portfolio`, branch `main`, commit `0335166` (2026-09-12)                 |
| Audited on          | 2026-09-13, Windows 11, Node 22.22.2, npm 10.9.7                                        |
| Client              | Jimmy Lubega, Technical Consultant and Platform Engineer (trading as purenest360 llc)   |
| Document status     | v1.0, analysis and planning only, no implementation code written                        |
| Source of truth for | Every implementation phase that follows. Work through phases in order, one per session. |

---

## 1. Executive summary

The site today is a clean but very young Astro 7 scaffold: 16 source files committed in a single "Build technical consulting portfolio" commit on 2026-09-11, then four commits in two days that only changed the production domain. It builds with zero errors, type-checks clean, ships almost no JavaScript, and already has sensible SEO plumbing (canonical URLs, Open Graph, JSON-LD, a sitemap). It is live on Vercel at jimmylubega.com. That is a good foundation, and the Astro architecture, the typed `profile.ts` data, the Vercel setup and the three case-study texts are worth keeping.

The gap between what exists and the brief is wide. Of the five sections Jimmy asked for, only Home and Projects exist as routes; About, Education and Certifications, and Connect and Resume do not exist, while a Blog page and a Contact page exist that were not requested. There is no theme system at all (the site is dark-only), no light-bulb toggle, no time-of-day or system-preference logic, and no cross-page transitions. The one animated element (an orbiting set of tech chips) costs 66 KB of compressed React runtime on the home page for a purely decorative effect. Project pages hotlink stock photos from Unsplash: one of those links is dead (404), another is a 1.9 MB image, and none go through Astro's image pipeline.

Two findings need Jimmy's attention before build work starts. First, the Calendly setup is not what the brief describes: the 30-minute event is currently configured to charge $100 through Stripe, while the 1-hour event has no payment attached and is free. The site also only links the 30-minute event, and quotes the hour at $80 rather than $100. Second, the production domain has been changed four times in two days and currently points at `jlpro.com`, which does not resolve; the deployed site still carries `jimmylubega.com` canonicals, so the live build is behind the repository.

In practice "enhance" will mean rebuilding nearly every file against a design-token system while keeping the Astro architecture, because rebuilding sections on top of the current ad hoc styling would mean doing the work twice. The plan below is fourteen phases, ordered by dependency, from tooling and tokens through the theme system, global shell, one phase per section, then motion, imagery, accessibility and SEO hardening, performance and deployment, and finally the domain purchase and transfer, which is a human task for the developer. Rough total effort is 75 to 100 hours of focused work, plus content that only Jimmy can supply.

---

## 2. Current state analysis

### 2.1 Stack and configuration

| Item                   | Finding                                                                                                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework              | Astro 7.3.2 (`astro`), `output` defaults to `static`; no adapter, no SSR, no hybrid routes                                                                                                                                                                        |
| Integrations           | `@astrojs/sitemap` 3.7.4, `@astrojs/react` 6.0.5                                                                                                                                                                                                                  |
| UI runtime             | React 19.3.0, react-dom 19.3.0 (used by exactly one component)                                                                                                                                                                                                    |
| Styling                | Tailwind CSS 4.3.3 via `@tailwindcss/vite` 4.3.3 (Vite plugin, not the deprecated Astro integration); `@tailwindcss/typography` 0.5.20 loaded with `@plugin` in `global.css`                                                                                      |
| TypeScript             | 6.0.3, `tsconfig.json` extends `astro/tsconfigs/strict`, includes `.astro/types.d.ts` and `**/*`, excludes `dist`                                                                                                                                                 |
| Type checking          | `@astrojs/check` 0.9.10, `npm run check` passes: 13 files, 0 errors, 0 warnings, 0 hints                                                                                                                                                                          |
| Image service          | `sharp` 0.35.4 is installed transitively and is Astro's default image service, but nothing in the codebase uses `astro:assets`                                                                                                                                    |
| Fonts                  | Astro 7's stable Fonts API (`fonts:` config key, `<Font />` component, local and remote providers) is available and unused; fonts load from Google Fonts CSS instead                                                                                              |
| View transitions       | `ClientRouter` from `astro:transitions` is available and unused                                                                                                                                                                                                   |
| Content layer          | `glob` and `file` loaders are available; there is no `src/content.config.ts`, so no collections are defined                                                                                                                                                       |
| Site URL               | `astro.config.mjs` sets `site: 'https://jlpro.com'` with a `// TODO: replace with your real domain` comment. History: `jimmylubega.com` (initial), `purenest360llc.com`, `jimmylubega.com`, `jlpro.com` (HEAD). `jlpro.com` does not resolve in DNS               |
| Deployment             | `vercel.json` (framework astro, `npm run build`, `dist`). Live at `https://jimmylubega.com` (Vercel anycast IP 76.76.21.21, `<meta name="generator" content="Astro v7.3.2">`), but with canonical `https://jimmylubega.com/`, so the deployed build predates HEAD |
| Node                   | `engines.node >=22.12.0`; `allowScripts.esbuild: true`                                                                                                                                                                                                            |
| Linting and formatting | None. No ESLint, Prettier, Biome or EditorConfig. No `.github/` workflows. No `.env.example` (nothing needs secrets today)                                                                                                                                        |
| Editor                 | `.vscode/extensions.json` recommends the Astro extension; `launch.json` starts `astro dev`                                                                                                                                                                        |
| Git hygiene            | `.gitignore` covers `node_modules`, `dist`, `.astro`, `.vercel`, `.DS_Store`                                                                                                                                                                                      |

Build output (`npm run build`, 2026-09-13):

```
[build] output: "static"  mode: "static"
8 page(s) built in 2.17s
[@astrojs/sitemap] sitemap-index.xml created at dist
```

No warnings. Dev server (`astro dev`, port 4321) console on every route: only Vite's connection message and React's dev-only DevTools hint. No errors, no failed requests other than the dead Unsplash image described in 2.8.

### 2.2 File structure

```
tech-portfolio/
├── astro.config.mjs          site URL (wrong), sitemap + react integrations, Tailwind Vite plugin
├── tsconfig.json             extends astro strict
├── vercel.json               Vercel build config
├── package.json              scripts: dev, build, preview, astro, check
├── README.md                 short structure notes; still describes the $80 hour and the 30min-only Calendly link
├── .gitignore
├── .vscode/                  extension recommendation + launch config
├── public/
│   ├── favicon.svg           32x32 "JL" monogram, cyan on near-black, monospace text
│   ├── favicon.ico           actually a 32x32 PNG with an .ico extension (655 bytes)
│   └── robots.txt            Allow all; Sitemap points at https://jimmylubega.com/sitemap-index.xml (mismatches astro.config site)
└── src/
    ├── components/
    │   ├── Nav.astro         sticky header, 5 links (Home, Blog, Projects, Book a Call, Contact), aria-current, mono wordmark "> Jimmy speaks tech_"
    │   ├── Footer.astro      LinkedIn + GitHub links from profile.ts, copyright "purenest360 llc"
    │   └── TechOrbit.tsx     React island: two rotating rings + 4 floating chips (K8s, IaC, TLS, CLI), cycles opacity every 2.4s
    ├── content/
    │   └── projects/
    │       └── posit-ssl.md  ORPHAN: no frontmatter, no content.config.ts, not referenced, not in build output. Longer draft of the posit-ssl page
    ├── data/
    │   └── profile.ts        typed data: profile, social links, 5 certifications, 6 skill groups, 5 experience entries, education. Deliberately excludes email/phone
    ├── layouts/
    │   ├── BaseLayout.astro  html shell, meta/OG/Twitter, JSON-LD (ProfessionalService), Google Fonts link, skip link, Nav + Footer, global font-family rules
    │   └── ProjectLayout.astro  case-study frame: hero with background image via CSS variable, status pill, stack chips, prose body
    ├── pages/
    │   ├── index.astro       hero + TechOrbit, 3 service cards, certifications grid
    │   ├── blog.astro        single hardcoded essay "The Open Tech Era" (not requested)
    │   ├── book.astro        Calendly inline iframe (30min only), option copy (Free / $80), 10px legal text
    │   ├── contact.astro     LinkedIn, GitHub, Book links; "what you gain" blurbs
    │   └── projects/
    │       ├── index.astro   hardcoded array of 3 project summaries (duplicates the markdown frontmatter)
    │       ├── posit-ssl.md              Markdown page with layout frontmatter (200 lines)
    │       ├── linux-hardening-selinux.md  Markdown page with layout frontmatter (104 lines); hero image 404s
    │       └── enterprise-infrastructure-builds.md  Markdown page (52 lines); hero image 1.9 MB
    └── styles/
        └── global.css        @import tailwindcss, @plugin typography, 4 unused :root variables, body background, .project-hero, float/spin keyframes, mobile !important overrides
```

Source volume, excluding the lockfile: roughly 1,400 lines across 16 files. This is scaffolding, not an established codebase.

### 2.3 Pages and routes

| Route                                        | Source                                               | Contains                                                                                                  | Maps to brief                                                                                              |
| -------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/`                                          | `pages/index.astro`                                  | Hero (headline, tagline, two CTAs, TechOrbit island), "What I help teams do" 3 cards, certifications list | Home: partial. No Book a Call section, no About excerpt, wrong copy versus the brief                       |
| `/projects`                                  | `pages/projects/index.astro`                         | 3 project cards from a hardcoded array                                                                    | Projects: partial. No imagery, data duplicated from markdown                                               |
| `/projects/posit-ssl`                        | `pages/projects/posit-ssl.md`                        | Full how-to style case study with code blocks and troubleshooting table                                   | Projects detail: present                                                                                   |
| `/projects/linux-hardening-selinux`          | `pages/projects/linux-hardening-selinux.md`          | Case study, SELinux operations                                                                            | Projects detail: present, broken hero image                                                                |
| `/projects/enterprise-infrastructure-builds` | `pages/projects/enterprise-infrastructure-builds.md` | Case study, 400+ physical / 2,000+ VMs                                                                    | Projects detail: present                                                                                   |
| `/book`                                      | `pages/book.astro`                                   | Calendly iframe (30min), options copy, legal aside                                                        | Book a Call: partial, wrong pricing, missing 1-hour link, lives on its own page rather than Home           |
| `/contact`                                   | `pages/contact.astro`                                | LinkedIn, GitHub, Book links                                                                              | Connect and Resume: partial (no resume mention, wrong name)                                                |
| `/blog`                                      | `pages/blog.astro`                                   | One essay, hardcoded                                                                                      | Not requested                                                                                              |
| `/about`                                     | none                                                 | 404                                                                                                       | About: missing                                                                                             |
| `/education` (or similar)                    | none                                                 | 404                                                                                                       | Education and Certifications: missing (certs appear as a list on Home; degree exists only in `profile.ts`) |
| `/connect` (or similar)                      | none                                                 | 404                                                                                                       | Connect and Resume: missing as named                                                                       |
| `/404`                                       | none                                                 | Astro default 404                                                                                         | Missing custom page                                                                                        |
| `/og-image.png`                              | none                                                 | 404, but referenced in 16 meta tags across all 8 pages                                                    | Broken social previews                                                                                     |

### 2.4 Components

| Component             | Type         | Hydration     | What it does                                                                                                   | Verdict                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ------------ | ------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Nav.astro`           | Astro        | none          | Sticky translucent header, link list, active state via `Astro.url.pathname`                                    | Fine structurally; links and wordmark will change; no mobile menu, links wrap to a second row under 640px                                                                                                                                                                                                                                                               |
| `Footer.astro`        | Astro        | none          | Two social links, copyright                                                                                    | Thin; rebuild                                                                                                                                                                                                                                                                                                                                                           |
| `TechOrbit.tsx`       | React        | `client:load` | Renders two decorative rings and four chips; a `setInterval` changes which chip is at full opacity every 2.4 s | Hydrated but does not need to be. The only client state is a cycling index that could be a CSS animation. It is `aria-hidden`, so it is invisible to assistive tech but still costs 213 KB raw / 66 KB gzip of React runtime plus the component, on the most important page. Replace with static SVG + CSS, or a purpose-built island that earns its cost (see Phase 4) |
| `BaseLayout.astro`    | Astro layout | none          | Head, meta, fonts, shell                                                                                       | Keep the idea, rewrite the content: fonts, theme script, JSON-LD shape, meta cleanup                                                                                                                                                                                                                                                                                    |
| `ProjectLayout.astro` | Astro layout | none          | Case-study hero and prose                                                                                      | Replace with a collection-driven `[slug].astro` route and a `CaseStudyLayout`                                                                                                                                                                                                                                                                                           |

No other islands. Every page except Home ships zero JavaScript, which is the correct baseline to protect.

### 2.5 Styling

This is real Tailwind 4 utility usage, mixed with a small unlayered CSS file, and it is ad hoc.

- No design tokens. There is no `@theme` block anywhere. Color is chosen per element: 46 distinct Tailwind color utilities across the source (`cyan-300` 26 times, `white` 25, `white/10` 18, `slate-300` 18, plus `sky-100/80`, `sky-100/75`, `sky-100/70`, `lime-300/50`, `emerald-300/15`, `slate-900/40` and so on), plus two arbitrary hex values (`bg-[#071a2d]` x3, `bg-[#08294a]` x4).
- The four `:root` variables in `global.css` (`--ink`, `--blue`, `--cyan`, `--line`) are never referenced. Dead code.
- The body background is declared twice and the two declarations disagree: `bg-[#071a2d]` on `<body>` in `BaseLayout.astro`, and `body { background: #0a3158 }` in `global.css`. Because `global.css` rules are unlayered and Tailwind 4 utilities live in `@layer utilities`, the CSS file wins, so the page background is `#0a3158` while the nav is `#071a2d/85`. Nobody chose that; it is an accident of cascade layers.
- Fonts are set through a `<style is:global>` block in the layout (`h1, h2, h3, .font-display` get Space Grotesk, body gets DM Sans, code gets IBM Plex Mono) rather than through `--font-*` tokens, so `font-display` and `font-mono` classes rely on custom CSS rather than Tailwind's own utilities.
- There is no typography scale. Headings use whatever size fits the moment: `text-4xl sm:text-7xl` on Home, `text-4xl sm:text-6xl` on Book and Contact, `text-3xl sm:text-4xl` on Projects.
- No spacing rhythm is defined; section padding varies (`py-24 sm:py-32`, `py-16 sm:py-20`, `py-16`, `py-16 sm:py-24`).
- Dark only. There is no light palette and no mechanism to switch.
- `.project-hero` in `global.css` carries a hardcoded Unsplash fallback URL and `!important` overrides at mobile widths.
- Radius is inconsistent: `rounded-md` buttons, `rounded-lg` cert cards, `rounded-xl` project cards, `rounded-full` chips and pills.

The result looks competent in a screenshot (navy, cyan accents, mono eyebrows) but there is nothing to build on. Any new section would have to reinvent the same choices, and the light theme cannot be added without a token layer. Verdict: rebuild the styling layer from tokens up; keep the general navy-and-cyan direction as a starting point for the dark palette.

### 2.6 Content model

Copy lives in four different places:

1. `src/data/profile.ts`: name, title, location, tagline, summary, social links, certifications, skill groups, experience, education. Typed, well organized, public-safe. This is the best-structured content in the repo.
2. Hardcoded in page markup: the Home hero copy, the three service cards, the Book page options and legal text, the Contact blurbs, the entire Blog essay, and the Projects index card array (which duplicates the markdown frontmatter by hand, so a title change must be made twice).
3. Markdown pages with `layout:` frontmatter under `src/pages/projects/`: the three case studies. Frontmatter is typed only by an `interface Frontmatter` cast in the layout, so a typo in a field name fails silently.
4. An orphaned `src/content/projects/posit-ssl.md` with no frontmatter and no collection config. It is not part of the build.

Implications for the client: today Jimmy can edit certifications, skills and experience in one typed file without a developer, but changing a project summary means editing two files, and any Home, About or Book copy requires editing Astro markup. The plan moves projects, certifications and education into content collections with schemas (Phase 7 and Phase 6), and keeps `profile.ts` (renamed `site.ts`) for identity, links and Calendly URLs. After that, all client-editable content is either a Markdown file with validated frontmatter or a single typed data file.

### 2.7 Integrations audit

**Calendly.** Present, but not as described.

- Embed method: a raw `<iframe src="https://calendly.com/jimmylubegapro/30min?embed_type=Inline&hide_gdpr_banner=1">` on `/book`, plus a plain fallback link. The official embed script is not used.
- Only the 30-minute URL appears anywhere in the repository. The 1-hour URL (`https://calendly.com/jimmylubegapro/1-hour`) is not referenced at all.
- Both event types were fetched directly on 2026-09-13. Both are public, "instant" booking, Google Meet, availability through 2026-11-12, timezone America/New_York.
  - `30min` is titled "30 Minute Meeting", 30 minutes, and **has an active Stripe payment method of $100 USD** (`amount_with_symbol: "$100"`). The embedded widget on `/book` visibly shows "$100 USD" directly beside page copy that says "30 minutes · Free".
  - `1-hour` is titled "1 hour Tech Meeting with Jimmy", 60 minutes, and **has no payment method** (`has_active_payment_method: false`), so it is free.
- The brief says the opposite: 30 minutes free, 1 hour $100. The site copy says a third thing: 60 minutes $80. Until Calendly is corrected, a prospect clicking the "free" call is asked for $100.
- The `hide_gdpr_banner=1` parameter does not suppress Calendly's cookie banner in the raw iframe; the banner rendered inside the widget in testing.
- Verdict: the links load and the account works. "Wired up and working" is not accurate for the offer Jimmy described. This is a client task (see Section 5) and a Phase 4 prerequisite.

**Sitemap.** Present via `@astrojs/sitemap`; `dist/sitemap-index.xml` and `sitemap-0.xml` list all 8 routes under `https://jlpro.com/`, a domain that does not resolve. `robots.txt` points at `https://jimmylubega.com/sitemap-index.xml`. The two disagree.

**Analytics.** Absent. No Vercel Analytics, Plausible, Umami or GA.

**Contact form or mailto.** Absent. `profile.ts` deliberately excludes email, and the brief routes contact through LinkedIn and Calendly, so a form is not required. No mailto anywhere.

**LinkedIn link and resume download.** LinkedIn (`linkedin.com/in/jimmy-lubega-393652184/`) and GitHub (`github.com/j-lubega`) links are present in the footer and Contact page with `rel="noopener noreferrer"`. There is no resume PDF in `public/` and no mention of a resume anywhere. The brief asks for "connect with me on LinkedIn for a resume", which implies no PDF; confirm (Open question 6).

**Theme toggle.** Absent. No toggle, no `data-theme`, no `prefers-color-scheme` handling, no `color-scheme`, one hardcoded `theme-color` meta (`#0b5cab`).

### 2.8 Assets

| Asset             | Where                                                                                | Format and size                         | Notes                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `favicon.svg`     | `public/`                                                                            | SVG, 234 B                              | "JL" monogram in monospace; fine as a placeholder                                                                        |
| `favicon.ico`     | `public/`                                                                            | PNG data, 32x32, 655 B, misnamed `.ico` | Browsers tolerate it; replace with a real multi-size `.ico` or drop it and add `apple-touch-icon.png` and a web manifest |
| `og-image.png`    | referenced, absent                                                                   | 404                                     | Every page's `og:image` and `twitter:image` points at it. LinkedIn and Slack previews currently show no image            |
| Case study hero 1 | hotlinked from Unsplash (`photo-1563013544`), `posit-ssl.md`                         | JPEG, 2400 w, 336 KB                    | Works; unoptimized, no AVIF/WebP, no srcset, third-party dependency                                                      |
| Case study hero 2 | hotlinked (`photo-1563770660941`), `linux-hardening-selinux.md`                      | **HTTP 404**                            | The hero renders as a bare gradient; the browser logs `ERR_BLOCKED_BY_ORB`                                               |
| Case study hero 3 | hotlinked (`photo-1558494949`, `w=3840&q=95`), `enterprise-infrastructure-builds.md` | JPEG, 3840 w, **1.9 MB**                | Also the `global.css` fallback at 2400 w (725 KB)                                                                        |
| Headshot          | none                                                                                 |                                         | Needed for About and possibly Home                                                                                       |
| Logos             | none                                                                                 |                                         | Certification badge images or vendor logos, subject to permission                                                        |

`astro:assets` is not used anywhere; there are zero `<img>` tags in the built HTML. All imagery is CSS `background-image` with remote URLs, which Astro cannot optimize.

What the 4K project backgrounds will require: one source image per case study (3 now, more as Jimmy adds projects), 3840 px wide or larger, infrastructure-themed and matched to the subject (TLS and certificates, Linux hardening, large-scale builds), stored in `src/assets/projects/` so Astro can emit AVIF and WebP at 640, 1024, 1600 and 2560 widths. Legitimate sources: Unsplash (Unsplash License: free for commercial use, no attribution required, no hotlinking at scale) and Pexels (Pexels License, similar). Each chosen photo's license page should be saved with the asset. Avoid Getty, Shutterstock and Adobe Stock results in image search, and avoid any image that shows a recognizable vendor's branded hardware or a person's face. See Phase 10.

### 2.9 Baseline quality

Measured with headless Chrome on the dev server at 390 px and 1440 px on all 8 routes.

**Accessibility**

- Heading order is correct on every page: one `h1`, `h2` and `h3` nest properly. Good.
- `lang="en"`, viewport meta, skip link, `aria-label="Primary"` on the nav, `aria-current="page"` on the active link, `title` on the Calendly iframe: all present. Good.
- No `<img>` elements exist, so alt text is not an issue yet; it will be once imagery arrives.
- Focus states: no custom `:focus-visible` styling anywhere; the site relies on the browser's `outline: auto`. Functional in Chrome, inconsistent elsewhere, and invisible on the cyan primary button in some engines.
- Reduced motion: no `prefers-reduced-motion` rule anywhere. The orbit rings spin forever (`spin 24s linear infinite`), chips float forever, and the wordmark cursor pulses forever.
- Contrast (WCAG AA, computed against effective backgrounds): every page passes except the `/book` legal aside, which is 10 px text at 2.77:1. It is also an `h2` at 10 px, which is a heading-hierarchy smell.
- No horizontal overflow at 390 px on any route (verified with real viewport emulation). Nav links wrap to a second row below 640 px rather than collapsing into a menu; usable but unpolished.
- The Calendly iframe is `h-[54rem]` (864 px) fixed height; the widget scrolls internally on phones.

**SEO**

- Present and correct in shape: `<title>` with site name, description, canonical, `og:*`, `twitter:*`, JSON-LD, sitemap, robots.
- Broken in value: `og:image` 404s; canonical, OG URL and sitemap use `jlpro.com` (does not resolve); robots points at a different domain; the live deployment's canonicals differ from HEAD.
- Questionable: `meta name="keywords"` (ignored by search engines since 2009), non-standard `meta name="service"` and `meta name="category"`, `profile:first_name` tags alongside `og:type=website` (they belong with `og:type=profile`).
- JSON-LD is a `ProfessionalService` with `provider` of `Organization: purenest360 llc`. For a personal consultant brand a `Person` entity (with `jobTitle`, `knowsAbout`, `sameAs` to LinkedIn and GitHub) linked to the `Organization` is the stronger shape; case studies have no `Article`/`TechArticle` markup and no `BreadcrumbList`.
- The site name and JSON-LD `name` ("Jimmy [U+2014] Technical Consultant") contain an em-dash character, which violates the client's copy constraint.

**Build output and performance**

| Asset                                       | Raw       | Gzip     |
| ------------------------------------------- | --------- | -------- |
| `client.*.js` (React runtime for TechOrbit) | 212,931 B | 65,725 B |
| `react.*.js` (renderer glue)                | 7,899 B   | 3,039 B  |
| `TechOrbit.*.js`                            | 1,689 B   | 895 B    |
| `BaseLayout.*.css` (all Tailwind output)    | 42,008 B  | 8,064 B  |
| `index.html`                                | 16,365 B  | 5,311 B  |
| Whole `dist/`                               | 412 KB    |          |

- Home ships ~70 KB gzip of JS for a decoration. Every other page ships 0 KB. That is the single largest performance issue and the easiest to fix.
- Fonts: one render-blocking stylesheet from `fonts.googleapis.com`, 3 families, 9 weights requested, 27 `@font-face` blocks returned, ~89 KB of latin woff2. Not self-hosted, which is both a performance and a privacy issue (Google Fonts embeds have been ruled non-compliant under GDPR in at least one EU jurisdiction). Astro 7's Fonts API fixes both.
- Hero images: 1.9 MB and 725 KB JPEGs as CSS backgrounds with no responsive variants; one 404.
- `scroll-behavior: smooth` on `html` unconditionally (should be gated by reduced motion).
- No 404 page, no `apple-touch-icon`, no web manifest.

### 2.10 Gap analysis

| Client requirement                                                 | Status      | Note                                                                                                                                                                                         |
| ------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Review and enhance the existing site                               | In progress | This document                                                                                                                                                                                |
| Use the reference site as presentation inspiration                 | Missing     | Nothing of the reference's structure (two-column hero, section illustrations, education page, contact-and-resume page) is present. See Section 3 for what to take and what not to            |
| Clean, modern, professional, visually engaging                     | Partial     | Clean and professional; not visually engaging (no imagery, one decorative orbit); no light mode                                                                                              |
| Home / Landing page                                                | Partial     | Exists; wrong sections and copy for the brief                                                                                                                                                |
| About section                                                      | Missing     | The brief's About text appears nowhere; `profile.summary` is a different paragraph                                                                                                           |
| Education and Certifications                                       | Partial     | Five certifications listed on Home as plain text; degree only in `profile.ts`; no route, no dates, no issuers, no badge imagery                                                              |
| Projects                                                           | Partial     | 3 case studies with real technical content; no imagery, hardcoded index, duplicated data, one broken hero                                                                                    |
| Connect and Resume (LinkedIn)                                      | Partial     | LinkedIn link exists on `/contact`; no resume mention; route named Contact                                                                                                                   |
| Book a Call section on Home                                        | Missing     | Exists only as `/book`; Home has a single "Book a technical call" button                                                                                                                     |
| Calendly 30-minute free discovery link                             | Partial     | Linked and loads, but Calendly charges $100 for it                                                                                                                                           |
| Calendly 1-hour $100 link                                          | Missing     | Not linked anywhere; on Calendly it is free; site says $80                                                                                                                                   |
| About copy as provided                                             | Missing     | Must be used verbatim as the foundation                                                                                                                                                      |
| Technology-themed visual elements and tasteful icons throughout    | Missing     | No icons; one orbit decoration on Home                                                                                                                                                       |
| 4K infrastructure background imagery on Projects                   | Partial     | Hotlinked stock on case-study heroes only; none on the Projects index; one 404; none optimized                                                                                               |
| Light-bulb theme toggle                                            | Missing     | No toggle                                                                                                                                                                                    |
| Theme from system preference or time of day                        | Missing     | Dark only                                                                                                                                                                                    |
| Manual override persists                                           | Missing     |                                                                                                                                                                                              |
| Smooth, consistent theme transition across pages                   | Missing     | No view transitions, no theme                                                                                                                                                                |
| Use Astro's capabilities                                           | Partial     | Astro static routing and Markdown used; content collections, `astro:assets`, Fonts API, view transitions all unused                                                                          |
| Polished, responsive, professional                                 | Partial     | Responsive without overflow; nav wraps; polish is limited by the missing token system                                                                                                        |
| Accurately represent a Technical Consultant and Platform Engineer  | Partial     | Positioning leans heavily on Posit Team support (JSON-LD `serviceType`, hero subtitle) rather than the broader Cloud, Linux, Automation, Kubernetes framing in the brief                     |
| Purchase `jlpro-po.com` via Cloudflare, transfer to client account | Not started | Human task, Phase 13. `jlpro-po.com` currently has no DNS records                                                                                                                            |
| Already satisfied and worth keeping                                | Done        | Static Astro build, strict TypeScript, Tailwind 4 via Vite, sitemap integration, skip link, semantic headings, `profile.ts` structure, Vercel config, three case-study texts as seed content |

---

## 3. Design direction

### 3.1 What "speaks tech" means for a platform engineer

A platform engineer's daily surfaces are a terminal, a YAML file, a Grafana board, an architecture diagram and a status page. The aesthetic that reads as credible to the people who hire one (engineering managers, CTOs, data-science platform leads) is the aesthetic of those tools: dense information presented calmly, monospace used as labels and metadata rather than as body text, diagrams instead of illustrations, and green-dot status semantics that quietly say "this person keeps things running". It is closer to a well-designed internal dashboard or vendor documentation than to a developer's personal brand site.

That differs from a generic developer portfolio in three ways. First, restraint: one accent color, hairline borders, no gradients on text, no glass cards stacked on glass cards. Second, vocabulary: eyebrow labels like `// platform`, `$ whoami`, `status: operational`, uptime-style numerals, stack tags rendered as chips that look like `kubectl` labels. Third, evidence over flourish: numbers (400+ physical servers, 2,000+ VMs), certifications with issuers and dates, case studies with problem, approach, stack and outcome.

Clichés deliberately avoided, with the reason:

- Matrix rain, falling binary, "hacker" green-on-black terminals: reads as 2005 and as a hobbyist.
- Glowing circuit-board traces, hexagon grids, neon lens-flare server racks: the stock-photo look of every MSP website.
- Cartoon developer illustrations (the reference site uses these throughout): friendly, but they say "junior developer", not "the consultant you pay $100 an hour".
- Orbiting technology badges (the current `TechOrbit`): a common AI-generated-portfolio tell, and it costs 66 KB of React to do nothing.
- Gradient text on every heading, animated blob backgrounds, glassmorphism everywhere: the current default of template sites, and they fight legibility in light mode.
- Rotating 3D globes and particle networks that react to the mouse: performance cost with no information content.
- Typing effects that never stop, cursors that blink forever: motion without purpose.

One signature visual is allowed and should be built well: a systems topology diagram in the hero (nodes for cloud, Kubernetes, Linux, IaC, observability, with edges between them and slow "packet" pulses that travel along the edges). It is the one place where the site draws something rather than showing type, and it doubles as a static SVG in reduced-motion mode.

### 3.2 Color system

Two palettes, expressed as semantic token roles. Components reference roles only; raw values live in one file. Values are proposals to be tuned in Phase 1 against real contrast measurements.

| Role              | Token                    | Dark ("night ops")       | Light ("daylight")     | Use                                                                                                                     |
| ----------------- | ------------------------ | ------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Canvas            | `--color-canvas`         | `#0B1220`                | `#F7F8FA`              | Page background                                                                                                         |
| Surface           | `--color-surface`        | `#111A2B`                | `#FFFFFF`              | Cards, panels                                                                                                           |
| Surface raised    | `--color-surface-raised` | `#182338`                | `#FFFFFF` + shadow     | Hover state, popovers, sticky header                                                                                    |
| Line              | `--color-line`           | `rgba(255,255,255,0.08)` | `rgba(15,23,42,0.08)`  | Hairline borders, dividers                                                                                              |
| Line strong       | `--color-line-strong`    | `rgba(255,255,255,0.18)` | `rgba(15,23,42,0.20)`  | Input borders, card hover                                                                                               |
| Foreground        | `--color-fg`             | `#E6EDF7`                | `#0F172A`              | Body and headings                                                                                                       |
| Foreground muted  | `--color-fg-muted`       | `#A5B1C5`                | `#475569`              | Secondary text                                                                                                          |
| Foreground faint  | `--color-fg-faint`       | `#6B7A93`                | `#5B6B82`              | Metadata, placeholders (still AA on canvas)                                                                             |
| Accent            | `--color-accent`         | `#5EE1FF`                | `#0369A1`              | Links, eyebrows, active nav, focus ring                                                                                 |
| Accent foreground | `--color-accent-fg`      | `#06121F`                | `#FFFFFF`              | Text on accent-filled buttons                                                                                           |
| Accent soft       | `--color-accent-soft`    | `rgba(94,225,255,0.12)`  | `rgba(3,105,161,0.10)` | Tinted backgrounds, chip fills                                                                                          |
| OK                | `--color-ok`             | `#4ADE80`                | `#15803D`              | Status dots, "completed" pills                                                                                          |
| Warn              | `--color-warn`           | `#FBBF24`                | `#B45309`              | Sparingly                                                                                                               |
| Danger            | `--color-danger`         | `#F87171`                | `#B91C1C`              | Form errors only                                                                                                        |
| Code background   | `--color-code-bg`        | `#0A1526`                | `#0F172A`              | Code blocks stay dark in both themes: terminals are dark                                                                |
| Code foreground   | `--color-code-fg`        | `#E6EDF7`                | `#E6EDF7`              |                                                                                                                         |
| Scrim             | `--color-scrim`          | `rgba(5,10,20,0.72)`     | `rgba(5,10,20,0.72)`   | Overlay on photographic backgrounds; image-backed surfaces are theme-invariant (dark) so text on photos is always light |

Rationale: the dark palette keeps continuity with the current navy-and-cyan brand and the existing favicon. The light palette uses a deep cyan-blue accent because the dark theme's `#5EE1FF` fails contrast on white (1.5:1); the accent hue is shared, the lightness flips. Cool off-white rather than pure white keeps the "paper" from glaring next to dark code blocks.

Implementation note (Tailwind 4): raw values are set on `:root` and `:root[data-theme="dark"]`; `@theme inline` maps `--color-canvas: var(--canvas)` and friends so `bg-canvas`, `text-fg-muted`, `border-line` work as normal utilities in both themes. A `@custom-variant dark` keyed on `[data-theme="dark"]` is registered for the rare cases where a `dark:` utility is still needed.

### 3.3 Type system

Pairing: **IBM Plex Sans** for display and body, **IBM Plex Mono** for labels, metadata, code and the terminal role line. Both are Open Font License, both ship as variable fonts, and they are one superfamily designed by IBM for exactly this register: enterprise systems, documentation, engineering. Plex Mono is already in the current site, so this is a reduction from three families to two rather than a change of direction. (Alternative if Jimmy wants a slightly more contemporary look: Geist and Geist Mono, also OFL, same logic.)

Self-hosted through Astro's Fonts API (`fonts:` in `astro.config.mjs`, `<Font cssVariable="--font-sans" preload />` in the head), which subsets, caches at build time and serves from the site's own origin. Weights: Sans 400, 500, 600; Mono 400, 500. `font-display: swap` with a size-adjusted fallback (`system-ui`, `ui-monospace`) to keep layout shift near zero.

Scale (fluid, major-third ratio 1.25 at the desktop end):

| Token        | Size                                   | Line height | Tracking          | Use                                     |
| ------------ | -------------------------------------- | ----------- | ----------------- | --------------------------------------- |
| `display`    | `clamp(2.5rem, 1.5rem + 4vw, 4.25rem)` | 1.05        | -0.02em           | Home hero only                          |
| `h1`         | `clamp(2rem, 1.4rem + 2.4vw, 3rem)`    | 1.1         | -0.015em          | Page titles                             |
| `h2`         | `clamp(1.5rem, 1.2rem + 1.2vw, 2rem)`  | 1.2         | -0.01em           | Section titles                          |
| `h3`         | `1.25rem`                              | 1.3         | 0                 | Card titles                             |
| `lead`       | `1.125rem`                             | 1.6         | 0                 | Intro paragraphs                        |
| `body`       | `1rem` (`1.0625rem` at 1280px+)        | 1.65        | 0                 | Prose                                   |
| `small`      | `0.875rem`                             | 1.5         | 0                 | Captions, footer                        |
| `mono-label` | `0.75rem`                              | 1           | 0.12em, uppercase | Eyebrows (`// about`, `01 / discovery`) |
| `mono-meta`  | `0.8125rem`                            | 1.5         | 0                 | Dates, stack tags, status, stats units  |

Where monospace earns its place: eyebrow labels, the nav wordmark, stack chips, dates and durations, the "$100 / 60 min" figures on Book a Call, the hero's typed role line, stat numerals, code blocks, and the topology node labels. Never for paragraphs, never for headings.

### 3.4 Spacing, radius, border and elevation

- Spacing: Tailwind's 4 px base. Section rhythm `py-16 md:py-24 lg:py-28`. Container `max-w-6xl` (72 rem) with `px-5 sm:px-8`. Prose measure `max-w-[65ch]`. Card padding `p-6 md:p-8`. Grid gaps `gap-6 lg:gap-8`.
- Radius tokens: `--radius-xs: 2px` (tags, status pills), `--radius-sm: 6px` (buttons, inputs), `--radius-md: 10px` (cards), `--radius-lg: 16px` (image panels, hero topology frame). No full pills except the theme toggle and status dots. Sharper corners read as "systems"; this is the main visual departure from HeroUI's rounded-3xl house style.
- Borders: 1 px in `--color-line` as the default separator; `--color-line-strong` on hover and inputs; focus ring `2px solid var(--color-accent)` with `outline-offset: 2px` on every interactive element via a global `:focus-visible` rule.
- Elevation: in dark mode, elevation is expressed by surface tier (canvas, surface, surface-raised) and a hairline, never by drop shadows (they vanish on dark canvases). In light mode, three shadows: `--shadow-1: 0 1px 2px rgba(15,23,42,.06)`, `--shadow-2: 0 4px 12px rgba(15,23,42,.08)`, `--shadow-3: 0 12px 32px rgba(15,23,42,.12)`. Tokens exist in both themes; dark sets them to `none`.

### 3.5 Motion philosophy

Motion exists to confirm state changes and to reveal structure, not to decorate. Rules:

- What animates: section reveals on first scroll into view (opacity 0 to 1, translateY 12 px to 0, 450 ms, stagger 60 ms, at most 6 items per group), hover and focus feedback (150 ms), the theme switch (250 ms on `background-color`, `color`, `border-color`, `fill`, `stroke`, applied through a temporary class on `<html>` so the site is not permanently transitioning everything), page navigation (Astro view transitions, 200 ms crossfade with the header persisted), the light-bulb toggle (filament glow and a short "switch" rotation), the hero topology's packet pulses (slow, 6 to 10 s loops, low contrast), and the hero role line (types once over ~1.8 s, cursor blinks for 4 s, then stops).
- What does not animate: text as parallax, headings on scroll after first reveal, anything infinite at full contrast, background blobs, the nav, project card content (only the card's border and scrim change on hover), and anything on the Book a Call cards other than button feedback.
- Timing tokens: `--dur-fast: 150ms`, `--dur-base: 250ms`, `--dur-slow: 450ms`; `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`; `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`. No bounce or elastic easings.
- Reduced motion, honored in three layers: a global CSS rule under `@media (prefers-reduced-motion: reduce)` that sets animation and transition durations to `0.01ms` and disables `scroll-behavior: smooth`; `MotionConfig reducedMotion="user"` wrapping every React island so Motion swaps transforms for instant opacity; and explicit fallbacks where content differs (the role line renders its final text, the topology renders static, the bulb toggles without the glow animation). Astro's built-in view-transition CSS already disables its animations under reduced motion.

### 3.6 The reference site: what to take and what to leave

The reference (`jonathan-myportfolio.netlify.app`) is a fork of the open-source `masterPortfolio` React template: Create React App, hash routing, anime.js, Font Awesome 4, Iconify, Google Analytics, Google Sans, a dark charcoal theme with a pink accent, animated cartoon SVG characters, and "⚡" bullet lists.

Take:

- The four-item information architecture in the header (About, Education and Certifications, Projects, Contact and Resume) and its plain, unclever labels. The client asked for exactly these sections.
- The two-column hero: greeting and role statement on the left, a visual on the right, social icons and one primary button under the text.
- "Here's what I do": alternating rows of a visual and a titled capability with a short bullet list and a row of technology icons. This maps well onto Cloud Infrastructure, Linux and Automation, Kubernetes and Platforms.
- A dedicated Education page with degree card and a certification grid.
- A Contact and Resume page whose whole job is one CTA plus social links.
- A moon/sun toggle in the header's right slot (ours becomes a light bulb).
- Generous whitespace between sections and a single accent color.

Leave:

- Hash routing and the client-side SPA. Astro gives real URLs, real HTML per page, and indexable case studies.
- The cartoon character illustrations and the "Made with ❤️" footer. Replaced by the topology diagram, technology iconography and photographic project backgrounds.
- Google Sans (not licensed for self-hosting) and Font Awesome 4 (2016).
- Fade-in-on-every-scroll `react-reveal` behavior applied to every block; we reveal once and only on first entry.
- Its projects page, which is a grid of tiny cards with no detail pages; ours needs full case studies.
- Its lack of a light theme done properly (the toggle exists but the design was clearly made for dark only); ours is designed for both from the token layer up.

---

## 4. Implementation plan

Conventions for every phase: work on a feature branch named `phase-NN-short-name` off `main`, open a PR, and merge only when acceptance criteria pass. `npm run check` and `npm run build` must pass at the end of every phase. No em-dashes in any copy, comment or commit message. Effort is a range for one experienced developer.

### Phase 0: Tooling and baseline

**Goal.** Fix the decisions and measurements everything else depends on, and remove the two broken things that would otherwise ship into every later screenshot.

**Depends on.** Nothing.

**Scope.**

- [ ] Record the dependency verdicts in this document's changelog and in `README.md`:
  - **HeroUI: do not adopt.** HeroUI v3.2.5 (2026-09-10) is genuinely built on Tailwind 4 (`peerDependencies.tailwindcss >=4.0.0`, React 19, React Aria Components), so compatibility is not the problem. The problems are: its `@heroui/styles` entry CSS does its own `@import "tailwindcss"` and declares the cascade layer order, so it takes over the project's CSS entry; it ships 178 custom properties with an opinionated look (`rounded-3xl` pill buttons, zinc neutrals, a blue accent, `--radius: 0.5rem`) that has to be fought to get the sharper systems look in Section 3; it keys its own light/dark theming on `.light`, `.dark` and `[data-theme]` selectors that would collide with our theme system; and it requires `react-aria-components` (6.5 MB unpacked) plus five `@react-aria/*` peers, a runtime this site's three or four small interactive pieces do not justify. **Use hand-rolled components with Tailwind, and add Radix primitives only where a React island genuinely needs one** (`@radix-ui/react-dialog` at 99 KB unpacked for a mobile nav sheet or image lightbox; nothing else is expected). Prefer native `<dialog>` and `<details>` inside `.astro` files where no React state exists.
  - **Animation: Motion only, no GSAP.** GSAP 3.15 is free for commercial use including all plugins since Webflow's acquisition, so licensing is not the deciding factor. The deciding factors are surface and shape: this site's animation surface is reveals, hover feedback, one hero SVG, a theme transition and page transitions. Nothing needs pinning, scrubbed timelines, SplitText or morphing. `motion` 13.2 covers all of it, in React islands (`motion/react`: `whileInView`, `useInView`, `useScroll`, `MotionConfig reducedMotion`) and, critically, in plain `.astro` `<script>` tags (`motion`: `animate`, `inView`, `scroll`; `motion/mini` is about 2.5 KB) since most of this site is not React. Running GSAP and ScrollTrigger (roughly 36 KB gzip, imperative) alongside Motion would be two runtimes for one job. Note that Framer Motion is now published as `motion`; the `framer-motion` package name is an alias at the same version. Escalation rule: if a future phase needs scroll-pinned storytelling, add `gsap` and `ScrollTrigger` for that island alone and document why.
- [ ] Add Prettier with `prettier-plugin-astro` and `prettier-plugin-tailwindcss` (class sorting), an `.editorconfig`, and `npm run format` / `format:check` scripts.
- [ ] Add ESLint (flat config) with `eslint-plugin-astro`, `@typescript-eslint`, `eslint-plugin-jsx-a11y` for `.tsx`, and `npm run lint`.
- [ ] Add a GitHub Actions workflow `.github/workflows/ci.yml` that runs `npm ci`, `format:check`, `lint`, `check`, `build` on pull requests.
- [ ] Decide and record the branch strategy: `main` is deployable; one branch per phase; squash-merge.
- [ ] Capture the baseline: full-page screenshots of all 8 routes at 390 px and 1440 px, and a Lighthouse run (mobile and desktop) per route against `npm run preview`, saved under `docs/baseline/2026-09-13/`. Record the four scores per route in `docs/baseline/README.md`.
- [ ] Fix the two broken references so they stop polluting every later measurement: add a temporary 1200x630 `public/og-image.png` (dark canvas, name, title; replaced properly in Phase 11), and replace the 404 Unsplash URL in `linux-hardening-selinux.md` with the same interim image as the other two (replaced properly in Phase 10).
- [ ] Set `site` to the domain that will actually go live (`https://jlpro-po.com`, pending Open question 1) and align `robots.txt` with it. Note in the PR that the domain is not yet live.
- [ ] Add `redirects` in `astro.config.mjs` for routes that will be removed or renamed later, so nothing in the current sitemap 404s after Phase 3: `/contact` to `/connect`, `/blog` to `/` (or keep Blog; Open question 8).
- [ ] Install runtime dependencies for later phases now so the lockfile churn happens once: `motion`, `astro-icon` with `@iconify-json/lucide` and `@iconify-json/simple-icons`. Do not install HeroUI, GSAP, or Radix yet.

**Files created or modified.** `package.json`, `package-lock.json`, `.prettierrc`, `.prettierignore`, `eslint.config.js`, `.editorconfig`, `.github/workflows/ci.yml`, `docs/baseline/**`, `public/og-image.png` (interim), `public/robots.txt`, `astro.config.mjs`, `README.md`, `src/pages/projects/linux-hardening-selinux.md` (one URL).

**Acceptance criteria.**

- `npm run format:check`, `npm run lint`, `npm run check`, `npm run build` all exit 0 locally and in CI.
- `docs/baseline/README.md` lists Lighthouse Performance, Accessibility, Best Practices and SEO for all 8 routes at both form factors.
- `curl -I https://<preview-url>/og-image.png` returns 200.
- No route in `dist/sitemap-0.xml` returns 404 on the preview deployment.
- `README.md` states the HeroUI and animation verdicts in two sentences each.

**Risks and gotchas.**

- `prettier-plugin-tailwindcss` must be listed last in the Prettier plugin array.
- ESLint's Astro parser and TypeScript 6 may need `typescript-eslint` at a version that declares TS 6 support; pin versions and check `npm ls` for peer warnings.
- Do not run Lighthouse against `astro dev`; the Vite client and React DevTools noise distort scores. Use `astro preview`.

**Rough effort.** 3 to 4 hours.

### Phase 1: Design system foundation

**Goal.** Encode Section 3 as tokens and primitives so every later phase composes rather than invents.

**Depends on.** Phase 0.

**Scope.**

- [ ] Create `src/styles/tokens.css`: raw palette variables on `:root` (light) and `:root[data-theme="dark"]` (dark), radius, shadow, duration and easing variables, and `color-scheme: light` / `dark` per theme so native controls and scrollbars follow.
- [ ] Rewrite `src/styles/global.css`: `@import "tailwindcss"`, `@import "./tokens.css"`, `@plugin "@tailwindcss/typography"`, an `@theme inline { ... }` block mapping every semantic token to a Tailwind namespace (`--color-*`, `--radius-*`, `--shadow-*`, `--font-sans`, `--font-mono`, `--ease-*`), `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`, a global `:focus-visible` rule, the reduced-motion rule, `body { background: var(--color-canvas); color: var(--color-fg) }`, and selection color. Delete the four dead variables, the duplicate body background, the `.project-hero` rule and the `!important` mobile overrides.
- [ ] Configure the Fonts API in `astro.config.mjs` for IBM Plex Sans (400, 500, 600) and IBM Plex Mono (400, 500) with `cssVariable` values `--font-sans` and `--font-mono`, and size-adjusted fallbacks. Remove the Google Fonts `<link>` tags and the `<style is:global>` font block from `BaseLayout.astro`.
- [ ] Add a typography layer in `src/styles/typography.css`: the fluid scale from 3.3 as utility classes (`.text-display`, `.text-h1`, `.text-h2`, `.text-h3`, `.text-lead`, `.text-mono-label`, `.text-mono-meta`) and a `prose` theme override so Markdown case studies inherit tokens (`--tw-prose-body: var(--color-fg)` and so on, including dark code blocks in both themes).
- [ ] Build the primitive components in `src/components/ui/`, all `.astro`, all token-driven, all with focus styles: `Button.astro` (variants primary, secondary, ghost; sizes sm, md, lg; renders `<a>` or `<button>`), `Eyebrow.astro` (mono label with optional index like `01 /`), `SectionHeader.astro` (eyebrow, h2, optional lead), `Card.astro` (surface, line border, optional hover lift), `Tag.astro` (stack chip, mono, radius-xs), `StatusPill.astro` (dot plus label, ok/warn/neutral), `Container.astro` (max-width and gutters), `Section.astro` (vertical rhythm, optional `tone="surface"`), `Icon.astro` (thin wrapper around `astro-icon` with size and `aria-hidden` defaults), `Stat.astro` (mono numeral, label).
- [ ] Add a `/design` page (excluded from the sitemap and `noindex`) that renders every token swatch, the type scale, and every primitive in both themes side by side. This is the review surface for the phase and the regression page for every later one.
- [ ] Rename `src/data/profile.ts` to `src/data/site.ts`; add `calendly: { discovery: { url, minutes: 30, price: 0 }, working: { url, minutes: 60, price: 100 } }`, `nav`, `domain`, and `brand` (name, tagline) fields; keep the existing exports. Remove the em-dashes from company strings.

**Files created or modified.** `src/styles/tokens.css` (new), `src/styles/global.css`, `src/styles/typography.css` (new), `astro.config.mjs` (fonts), `src/layouts/BaseLayout.astro` (fonts only), `src/components/ui/*.astro` (new, ~10 files), `src/pages/design.astro` (new), `src/data/site.ts` (renamed from `profile.ts`, all imports updated).

**Acceptance criteria.**

- `grep -rn "bg-\[#" src` and `grep -rnE "(slate|sky|cyan|lime|emerald)-[0-9]{3}" src/components/ui src/styles` return nothing: primitives use semantic tokens only.
- `/design` renders identically in structure with `data-theme="light"` and `data-theme="dark"` set manually on `<html>`; every text/background pairing in the swatch table is listed with its measured contrast ratio and all body-text pairs are at or above 4.5:1.
- The built HTML contains no request to `fonts.googleapis.com` or `fonts.gstatic.com`; woff2 files are served from `/_astro/` with `<link rel="preload">` for the two primary faces.
- Tabbing through `/design` shows a visible 2 px accent ring on every interactive element in both themes.
- With Chrome DevTools "Emulate prefers-reduced-motion", nothing on `/design` animates.
- `npm run build` CSS output stays under 15 KB gzip.

**Risks and gotchas.**

- Tailwind 4 `@theme` values are static at build; theme switching only works through the `@theme inline` plus CSS-variable indirection. A plain `@theme` will bake the light values in.
- Unlayered CSS beats `@layer utilities`. Keep everything in `tokens.css` and `typography.css` inside `@layer base` or `@layer components` so utilities can still override.
- The Fonts API downloads at build; CI needs network access on first build, then uses the cache. Commit nothing from `.astro/`.
- `prose-invert` from the typography plugin is not needed once the prose variables are token-driven; using both causes double overrides.

**Rough effort.** 6 to 8 hours (one full day).

### Phase 2: Theme system

**Goal.** Ship the light-bulb toggle with correct precedence, no flash of the wrong theme, persistence, and stability across view transitions.

**Depends on.** Phase 1.

**Precedence rule, stated explicitly.** Manual choice beats system preference beats time of day:

1. If `localStorage["jl-theme"]` is `"light"` or `"dark"`, use it. This is the visitor's manual choice and it persists until they clear it.
2. Otherwise, if `matchMedia("(prefers-color-scheme: dark)")` matches, use dark.
3. Otherwise (the OS reports light, which is also what browsers report when no preference is set), use time of day: dark from 19:00 to 06:59 local time, light from 07:00 to 18:59.

Interpretation note for the client: browsers cannot distinguish "the OS says light" from "no preference", so if system-light always won, time of day would never apply. The rule above treats an explicit dark preference as authoritative and lets time of day decide for everyone else. The alternative (system always wins, time of day never runs) is listed in Open question 3.

**Scope.**

- [ ] Write `src/scripts/theme.ts` exporting `resolveTheme()` (the precedence rule), `applyTheme(theme)` (sets `data-theme` on `<html>`, updates `<meta name="theme-color">`, and toggles `color-scheme`), `setManualTheme(theme)` and `clearManualTheme()`.
- [ ] Inline the resolver into `<head>` in `BaseLayout.astro` as a `<script is:inline>` (a minified copy of `resolveTheme` + `applyTheme`, under 600 bytes) placed before any stylesheet, so the first paint is already correct. Wrap `localStorage` access in `try/catch` for private mode.
- [ ] Re-apply on `astro:after-swap`: Astro's `swapRootAttributes` replaces every attribute on `<html>` during a view transition, which would drop `data-theme`. Listening to `astro:after-swap` (fires before the new page paints) keeps the theme stable. Also re-apply on `astro:page-load` for safety.
- [ ] Listen to the `prefers-color-scheme` media query `change` event and to `storage` events so two tabs stay in sync and OS switches are reflected when there is no manual override.
- [ ] Build `src/components/shell/ThemeToggle.astro`: a `<button type="button">` with `aria-label="Switch to light mode"` / `"Switch to dark mode"` (updated on toggle), `aria-pressed` reflecting dark, an inline SVG light bulb whose filament and glow are driven by `[data-theme="dark"]` selectors (bulb off in dark, on in light), and a small vanilla `<script>` that calls `setManualTheme`. No React: the toggle must work before any island hydrates and it has no state beyond the attribute.
- [ ] Theme transition: on toggle, add `.theme-transition` to `<html>` (which enables the 250 ms color transitions from Section 3.5), remove it after `transitionend` or 300 ms. Do not leave global transitions on permanently.
- [ ] Add a "Reset to automatic" text button in the footer (calls `clearManualTheme`), visible only when a manual choice is stored, so the visitor can return to system/time-of-day behavior.
- [ ] Two `<meta name="theme-color">` tags with `media="(prefers-color-scheme: ...)"` for the no-JS case, plus the script-driven update for the manual case.
- [ ] Document the rule and the storage key in `README.md`.

**Files created or modified.** `src/scripts/theme.ts` (new), `src/layouts/BaseLayout.astro`, `src/components/shell/ThemeToggle.astro` (new), `src/components/shell/Footer.astro` (reset control; the footer itself is rebuilt in Phase 3), `README.md`.

**Acceptance criteria.**

- Hard reload of any route with a stored `"dark"` or `"light"` choice shows no flash of the other theme (verify with DevTools Performance recording at 6x CPU throttling: the first painted frame has the correct `data-theme`).
- With `localStorage` cleared and OS set to dark, the site is dark at any hour. With OS set to light, the site is dark at 20:00 and light at 10:00 (test by overriding `Date` in the console or with the system clock).
- Clicking the bulb flips the theme within 300 ms, persists across reload, across all routes, and across a view-transition navigation (Phase 3) without a flash.
- "Reset to automatic" clears the key and the theme immediately matches the automatic rule.
- Toggle is operable with keyboard (Enter and Space), has a visible focus ring, and announces its state in a screen reader (`aria-pressed` and label change).
- JavaScript disabled: the site renders in the OS-preferred theme via the CSS `prefers-color-scheme` defaults in `tokens.css`; the toggle is hidden with a `noscript` style.
- With reduced motion, toggling swaps instantly (no glow animation, no transition).

**Risks and gotchas.**

- Time-of-day logic uses the visitor's clock, not the server's; that is intended.
- Putting the inline script after the stylesheet link reintroduces the flash. Order matters.
- `astro:after-swap` fires only when `ClientRouter` is present (Phase 3). Until then, full page loads run the inline script anyway.
- Tailwind's default `dark:` variant keys on `prefers-color-scheme`; without the `@custom-variant` from Phase 1, any stray `dark:` class will disagree with the manual toggle.

**Rough effort.** 4 to 6 hours.

### Phase 3: Global shell

**Goal.** Rebuild the header, footer and page frame on the token system, and make navigation feel like one continuous app across routes.

**Depends on.** Phase 1, Phase 2.

**Scope.**

- [ ] New IA and routes, matching the brief's five sections: `/` Home, `/about`, `/education`, `/projects` (+ `/projects/[slug]`), `/connect`. Keep `/book` as a deep-linkable page for the Book a Call block (Phase 4). Redirects (from Phase 0): `/contact` to `/connect`; `/blog` per Open question 8.
- [ ] `src/components/shell/Header.astro`: sticky, `backdrop-blur`, canvas at 85% opacity, hairline bottom border; left: wordmark in mono (`jimmy.lubega` with a subtle accent `~` or `>` prefix; no infinite blinking cursor); center/right: the five links with `aria-current`; far right: the ThemeToggle. Below `md`, links collapse into a menu button that opens a native `<dialog>` sheet (full-height, focus-trapped by the dialog element, `Esc` closes, links close on click). No React.
- [ ] `src/components/shell/Footer.astro`: three columns at `md` (identity and one-line positioning; section links; LinkedIn and GitHub with `simple-icons` glyphs), a bottom row with copyright (`purenest360 llc`), "Reset to automatic" theme control, and a `status: operational` mono line with a green dot as a quiet brand touch.
- [ ] `BaseLayout.astro`: `<ClientRouter />` from `astro:transitions`; `transition:persist` on the header and the theme toggle; `transition:name="main"` on `<main>` with the built-in `fade` at 200 ms; `<SkipLink />`; slot for per-page `<head>` extras; the Phase 2 theme script; cleaned meta (drop `keywords`, `service`, `category`, `profile:*`); `Seo.astro` and `JsonLd.astro` extracted into `src/components/seo/` with props for title, description, type (`website` or `article`), image and published date.
- [ ] Custom `src/pages/404.astro`: mono `404: route not found`, a short line, links to Home and Projects.
- [ ] Wire `astro-icon`: brand glyphs from `simple-icons` (AWS, Microsoft Azure, Kubernetes, Terraform, Ansible, Linux, Docker, GitHub Actions, Prometheus, Grafana, Posit) and UI glyphs from `lucide`. Verify each brand's trademark guideline allows the glyph in this context and keep a list in `docs/brand-icons.md`.
- [ ] Persist scroll position handling: view transitions default is fine; confirm the header does not re-animate on navigation.

**Files created or modified.** `src/components/shell/{Header,MobileNav,Footer,SkipLink}.astro` (new; `Nav.astro` and `Footer.astro` deleted), `src/components/seo/{Seo,JsonLd}.astro` (new), `src/layouts/BaseLayout.astro`, `src/pages/404.astro` (new), placeholder pages `about.astro`, `education.astro`, `connect.astro` (heading only, filled in later phases), `astro.config.mjs` (redirects, `astro-icon` integration), `docs/brand-icons.md`.

**Acceptance criteria.**

- Navigating between any two routes with JS enabled keeps the header and toggle in place (no re-render flash), crossfades `<main>` in 200 ms, and preserves the theme (Phase 2 criterion re-run).
- Navigating with JS disabled works as ordinary full-page loads with the correct theme from CSS defaults.
- At 375 px the header shows wordmark, menu button and toggle on one row; the menu opens a sheet, traps focus, closes on `Esc`, and returns focus to the button.
- Every header and footer link has a visible focus ring; the current page is marked with `aria-current="page"` and a visual indicator that does not rely on color alone (underline or mono bracket).
- `/contact` and `/blog` (if removed) return 301 to their new targets on the preview deployment.
- A request for a non-existent route renders the custom 404 with status 404.
- Lighthouse Accessibility on `/` and `/404` is 100.

**Risks and gotchas.**

- Inline `<script>` tags in `.astro` components run once per full load, not per view transition; any component that needs setup after navigation must listen to `astro:page-load`. The mobile menu and the theme toggle need this.
- `transition:persist` keeps the DOM node; state inside it (an open menu) persists across navigation, so close the menu on `astro:before-preparation`.
- `simple-icons` glyphs are trademarked by their owners; using them to indicate "works with X" is generally accepted, but do not restyle brand colors into the accent.

**Rough effort.** 6 to 8 hours (one full day).

### Phase 4: Home and Book a Call

**Goal.** Replace the home page with a landing page that states who Jimmy is in five seconds, proves it, and gets a prospect onto Calendly with the right offer.

**Depends on.** Phase 3. **Client prerequisite:** Calendly pricing corrected (Section 5, item 1).

**Scope.**

- [ ] `src/components/home/Hero.astro`: asymmetric two-column layout at `lg` (7/5 split), single column below. Left: mono eyebrow `$ whoami`; display heading "Hi, I'm Jimmy." with a second line "I build and support cloud platforms that stay up."; the typed role line (below); a lead paragraph derived from the brief's About text (first sentence); two buttons: primary "Book a free 30-minute call" (links to the Book section `#book`, which is above the fold on desktop and one scroll on mobile), secondary "See projects"; a row of LinkedIn and GitHub icon links. Right: the topology visual. Primary CTA is above the fold at 375 px, 768 px and 1440 px.
- [ ] `src/components/home/RoleLine.tsx` (React island, `client:idle`): types `Technical Consultant · Platform Engineer` then `Cloud · Linux · Automation · Kubernetes` on a second line, once, ~1.8 s total, cursor blinks for 4 s and stops; renders final text server-side so the content exists without JS; with reduced motion it never animates. This is the first legitimate island: it has a timeline and state, and it is small (Motion `animate` on a text sequence, under 3 KB).
- [ ] `src/components/home/Topology.astro` plus `TopologyPulses.tsx` (`client:visible`): an SVG diagram of six labeled nodes (AWS, Azure, Kubernetes, Linux, Terraform/Ansible, Observability) with edges; node labels in mono; static SVG rendered by Astro. The island only animates small circles along the edge paths with Motion (`offsetDistance`), 8 to 12 s loops at low contrast, and unmounts under reduced motion. Nodes carry `simple-icons` glyphs at 16 px.
- [ ] Proof strip under the hero: four `Stat` items from `site.ts`: `10+ yrs` infrastructure, `5` certifications, `400+` physical servers built, `2,000+` VMs (values from the enterprise case study; confirm with client, Open question 9).
- [ ] `src/components/home/Capabilities.astro`: "What I do" as three alternating rows (icon cluster left/right): Cloud Infrastructure (AWS, Azure, IaC, networking, IAM), Linux and Automation (RHEL/Rocky/Ubuntu, Ansible, Bash/Python, patching and hardening, CI/CD), Kubernetes and Platforms (EKS/AKS/GKE, Docker, Posit Team, observability). Each row: mono index, h3, three bullets, a row of technology `Tag`s with glyphs. Content seeded from `skillGroups`.
- [ ] `src/components/home/BookACall.astro` (also used by `/book`), anchored `#book`: section header "Book a call"; two `Card`s side by side at `md`: **Discovery consultation** (`30 min · Free`, "Tell me about your platform, get a straight opinion on the next step", three bullets, primary button "Book the free call") and **Working session** (`60 min · $100`, "Architecture review, troubleshooting, or an implementation plan, live", three bullets, secondary button "Book a working session"). Buttons link directly to the two Calendly URLs from `site.ts` with `target="_blank" rel="noopener"`. Progressive enhancement: a tiny script loads Calendly's `widget.js` on first click and opens the popup widget over the page (`Calendly.initPopupWidget`), falling back to the new tab if the script fails. Nothing from Calendly loads until a click. Add a one-line note: "Both calls run on Google Meet. Prices in USD."
- [ ] `/book` page: the same `BookACall` block plus the inline widget for the selected option (two buttons switch the iframe `src` between the two event URLs; iframe `title` describes the selected option), and the privacy note rewritten at 14 px in `fg-muted` (fix the 10 px / 2.77:1 failure). Keep the page thin; it exists for deep links.
- [ ] `src/components/home/SelectedWork.astro`: three project cards from the projects collection (Phase 7 schema; until then, from the current markdown via a temporary `import.meta.glob`), using the Phase 10 background treatment once available, otherwise surface cards.
- [ ] `src/components/home/CertStrip.astro`: five certification `Tag`s with issuer glyphs, linking to `/education`.
- [ ] Final CTA band: one sentence and the primary button (links to `#book`).
- [ ] Delete `TechOrbit.tsx` and the `float` and `spin` keyframes.
- [ ] Copy: draft all Home copy in `docs/copy/home.md` for the client to approve; no em-dashes.

**Files created or modified.** `src/pages/index.astro`, `src/pages/book.astro`, `src/components/home/*` (new), `src/components/home/RoleLine.tsx` and `TopologyPulses.tsx` (new islands), `src/data/site.ts`, `docs/copy/home.md`, delete `src/components/TechOrbit.tsx`.

**Acceptance criteria.**

- Home JS payload is under 25 KB gzip total (both islands plus Motion), measured from `dist/_astro/` and the network panel; the React runtime is only downloaded on Home. (Baseline: 70 KB.)
- Primary CTA is visible without scrolling at 375x667, 768x1024 and 1440x900.
- The two Calendly buttons open the correct event: 30-minute shows "30 Minute Meeting" (or the renamed title) with no price, 60-minute shows the hour event at $100. Verified in the popup and in the `/book` inline widget.
- No request to `calendly.com` or `assets.calendly.com` appears on Home before a Book button is clicked.
- With reduced motion: role line shows final text immediately, topology is static, reveals are instant; no `setInterval` remains anywhere in the built JS.
- Lighthouse Performance on Home (mobile, preview build) at or above 95; LCP element is the display heading, not an image or the SVG.
- All Home copy matches `docs/copy/home.md` after client approval; `grep -cP "\x{2014}" src/pages/index.astro src/components/home/*` returns 0 for every file.

**Risks and gotchas.**

- Calendly's popup widget script is ~50 KB and sets cookies; loading it only on click keeps it out of the initial budget and out of the consent question.
- The `offsetDistance` property for packet pulses is supported in all current engines but check Safari behavior on SVG paths; fall back to `stroke-dashoffset` animation if needed.
- Do not render the typed role text as `aria-live`; screen readers should get the final text only.
- Until Phase 7 lands, `SelectedWork` reads from `src/pages/projects/*.md`; remember to switch it.

**Rough effort.** 10 to 14 hours (two days).

### Phase 5: About

**Goal.** An About page that uses Jimmy's provided text as its foundation and turns the resume data into a scannable, credible story.

**Depends on.** Phase 3.

**Scope.**

- [ ] `src/pages/about.astro`: two-column intro at `lg`: left, eyebrow `// about`, h1 "Hello, I'm Jimmy." and the brief's paragraph verbatim as the lead ("Technical Consultant & Platform Engineer specializing in Cloud Infrastructure, Linux, Automation, and Kubernetes. I design, deploy, and support secure, scalable platforms across AWS and Azure..."); right, headshot in a `radius-lg` frame with a thin accent rule and a mono caption (`Virginia, USA · Remote worldwide`). Until a headshot arrives, a topology-style monogram placeholder, never a stock photo.
- [ ] "How I work" as three short principles (design before deploy, automate the second time, document the handover), each with a lucide glyph. Copy drafted in `docs/copy/about.md` for approval.
- [ ] Experience timeline from `site.ts` `experience`: vertical rail with mono dates, role, company, location, and bullets collapsed behind a `<details>` per role (first role open). Company strings cleaned of em-dashes and the "via purenest360 llc" note moved to a `note` field.
- [ ] Skills matrix from `skillGroups`: six groups as a two-column grid of `Tag` rows with glyphs where a brand icon exists.
- [ ] "Currently" block: a short mono line (`now: Posit Team deployments on Azure and AWS for Katalyze Data`) sourced from a `current` field in `site.ts`.
- [ ] Closing CTA linking to `/#book`.
- [ ] `Person` JSON-LD on this page (name, jobTitle, worksFor, knowsAbout from skills, sameAs LinkedIn and GitHub, image when the headshot exists).

**Files created or modified.** `src/pages/about.astro`, `src/components/about/{Intro,Principles,Timeline,SkillsMatrix}.astro` (new), `src/data/site.ts`, `src/assets/headshot.jpg` (client-supplied), `docs/copy/about.md`.

**Acceptance criteria.**

- The brief's About paragraph appears on the page verbatim except for the removal of typographic dashes, and is the first paragraph after the h1.
- Headshot is served through `astro:assets` as AVIF/WebP with explicit `width` and `height`, `alt="Jimmy Lubega"`, and `loading="eager"` (it is above the fold).
- Timeline is keyboard-operable (`<details>` toggles with Enter/Space) and every `<details>` has a descriptive `<summary>`.
- Page ships 0 KB of JavaScript.
- Rich Results Test recognizes the `Person` entity.

**Risks and gotchas.**

- `<details>` content is not animated by default; if a height animation is wanted, use `interpolate-size: allow-keywords` with a fallback rather than a script.
- Do not repeat the full experience bullets here and on a resume page; this page is the resume.

**Rough effort.** 4 to 6 hours.

### Phase 6: Education and Certifications

**Goal.** A dedicated page that presents the degree and certifications as verifiable credentials rather than a bullet list.

**Depends on.** Phase 3. **Client prerequisite:** certification issuers, dates, credential IDs or verification URLs, and badge image permissions (Section 5, item 4).

**Scope.**

- [ ] Content collections for credentials in `src/content.config.ts` using the `file` loader: `certifications.json` (fields: `name`, `issuer`, `issued` date, `expires` date optional, `credentialId` optional, `verifyUrl` optional, `badge` image path optional, `level` such as Professional or Associate, `tags`) and `education.json` (`degree`, `institution`, `location`, `years`, `notes`). Zod schema validation so a missing date fails the build rather than rendering "undefined".
- [ ] `src/pages/education.astro`: h1 "Education and certifications"; "Degree" card (Makerere University, BSc Computer Science, with a `graduationCap` glyph); "Certifications" grid of `CredentialCard`s: badge image (or issuer glyph if no badge permitted), name, issuer, mono `issued 2024-03 · expires 2027-03`, "Verify" link with external-link glyph when a URL exists; a "Status" `StatusPill` (Active / Expired) computed at build time from the expiry date.
- [ ] Issuer groups or filter chips (AWS, CNCF, CompTIA, Linux Professional Institute) as plain anchor filters (no JS): a `?issuer=` query is unnecessary; use in-page headings per issuer instead.
- [ ] Optional "Learning now" line from `site.ts`.
- [ ] `EducationalOccupationalCredential` JSON-LD entries attached to the `Person`.

**Files created or modified.** `src/content.config.ts` (new, shared with Phase 7), `src/content/certifications.json`, `src/content/education.json` (new), `src/pages/education.astro`, `src/components/education/{CredentialCard,DegreeCard}.astro` (new), `src/assets/badges/*` (client-supplied, if permitted).

**Acceptance criteria.**

- Adding a certification means adding one JSON object; the build fails with a readable Zod error if `issued` is missing or malformed.
- Each credential card has a single link (Verify) with an accessible name that includes the credential name, not just "Verify".
- Badge images use `astro:assets` with `alt` equal to the credential name; issuer glyph fallback is `aria-hidden` with the issuer name in text.
- Expiry status is correct on the build date and documented as "as of build date" in a footnote.
- Page ships 0 KB of JavaScript.

**Risks and gotchas.**

- AWS and CompTIA badge artwork is licensed for certified individuals to display through Credly; downloading and self-hosting the PNG is normally permitted for the credential holder but confirm with the client and keep the Credly link as the source of truth.
- Expiry computed at build time goes stale; note it, and schedule a monthly rebuild (Vercel deploy hook via a GitHub Actions cron) in Phase 12.

**Rough effort.** 4 to 5 hours.

### Phase 7: Projects

**Goal.** Turn the case studies into a schema-driven collection with a compelling index, full detail pages, and a content model Jimmy can extend without a developer.

**Depends on.** Phase 3; Phase 10 for the final imagery treatment (the phase can ship with interim images). **Client prerequisite:** case-study intake (below).

**Content honesty.** The three existing write-ups are real technical content, which is rare and valuable, but two of them read as how-to guides rather than case studies (the SSL piece is a step-by-step tutorial; the SELinux piece is an operating-model description), and the enterprise builds piece has scale but no named context, timeframe or outcome metric. A consultant's portfolio needs each project to answer: who was it for (or the sector, if confidential), what was broken or needed, what Jimmy did, with what stack, and what changed as a result, ideally with a number. The technical depth already written should move into an "Approach" or "Technical notes" section below a proper summary. Everything must be collected from Jimmy; the intake template is at the end of this phase.

**Scope.**

- [ ] Define the `projects` collection in `src/content.config.ts` with the `glob` loader over `src/content/projects/*.md` and a Zod schema: `title`, `summary` (max 200 chars), `client` (or `sector` when confidential), `role`, `period` (`{ start, end }` as `YYYY-MM`), `status` (`completed`, `ongoing`), `stack` (string array), `tags` (from a fixed enum: cloud, linux, automation, kubernetes, security, posit, observability), `problem`, `approach`, `outcome` (short strings for the card and the header), `metrics` (array of `{ value, label }`), `cover` (`image()` for the 4K background), `coverAlt`, `coverCredit` (`{ author, source, url }`), `featured` boolean, `order` number.
- [ ] Migrate the three case studies: move `src/pages/projects/*.md` into `src/content/projects/`, split each body into Overview / Problem / Approach / Outcome / Technical notes headings, fill frontmatter from the intake, delete the orphan `src/content/projects/posit-ssl.md` after merging any better wording into the migrated file. Remove em-dashes from body text.
- [ ] `src/pages/projects/index.astro`: h1 "Projects", a one-line intro, then a grid (1 column, 2 at `md`, 3 at `xl` when six or more exist) of `ProjectCard`s: the 4K cover as background with the `scrim` overlay, `StatusPill`, title, summary, stack `Tag`s, mono period, and one key metric. The whole card is a link with the title as the accessible name. Tag filter chips at the top that are plain anchors to `/projects?tag=kubernetes` handled at build time by generating one static page per tag (`/projects/tag/[tag]`), so filtering costs 0 KB of JavaScript.
- [ ] `src/pages/projects/[slug].astro` with `getStaticPaths` from the collection and `render(entry)`: header with the cover as a full-bleed background under a scrim, breadcrumb (`Projects / Title`), title, summary, metadata row (client or sector, role, period, status), stack tags, metrics strip; then a two-column body at `lg`: prose on the left (`max-w-[65ch]`), a sticky "At a glance" aside on the right (problem, approach, outcome in three short blocks, and an in-page table of contents generated from `headings`). Prev/next project navigation at the bottom and a "Discuss a similar project" CTA linking to `/#book`.
- [ ] `src/layouts/CaseStudyLayout.astro` replaces `ProjectLayout.astro`. Code blocks use Astro's Shiki with a token-aware theme pair (dark in both site themes, per Section 3.2) and a copy button added by a small vanilla script on `astro:page-load`.
- [ ] `TechArticle` JSON-LD and `BreadcrumbList` per case study; `og:type=article` with `article:published_time`.
- [ ] Update `SelectedWork` on Home to read `featured` projects from the collection.
- [ ] Write `docs/case-study-intake.md` (template below) and send it to the client.

**Case-study intake template (one per project, 20 minutes each):**

```
Title (working):
Client or sector (say "confidential, <sector>" if needed):
Your role and who else was involved:
Timeframe (month/year to month/year):
The situation: what existed before, what was failing or missing (3 to 5 sentences):
What you did, in order (5 to 8 bullets, name the tools):
Stack (list):
Outcome: what changed, with a number if at all possible (uptime, hours saved, servers migrated, time to provision):
One thing that went wrong or surprised you, and what you changed because of it:
Anything you cannot say publicly (names, IPs, screenshots):
Can we show a diagram of the architecture? (yes / redacted / no)
```

**Files created or modified.** `src/content.config.ts`, `src/content/projects/*.md` (moved and rewritten), `src/pages/projects/index.astro`, `src/pages/projects/[slug].astro` (new), `src/pages/projects/tag/[tag].astro` (new), `src/layouts/CaseStudyLayout.astro` (new, `ProjectLayout.astro` deleted), `src/components/projects/{ProjectCard,CaseStudyHeader,AtAGlance,Toc,PrevNext}.astro` (new), `src/components/home/SelectedWork.astro`, `docs/case-study-intake.md`, delete `src/pages/projects/*.md`.

**Acceptance criteria.**

- Adding a project is: add one Markdown file with valid frontmatter and one cover image; the index, tag pages, Home "Selected work", sitemap and prev/next update with no other edits. A frontmatter error fails `npm run build` with the field name.
- The three existing case-study URLs (`/projects/posit-ssl`, `/projects/linux-hardening-selinux`, `/projects/enterprise-infrastructure-builds`) still resolve (same slugs) so existing links do not break.
- Every project card and header has readable text over its image in both themes: measured contrast of `fg` on the scrim-over-image at the darkest and lightest 10% of the image is at least 4.5:1 (spot check with DevTools color picker on three points per card).
- Case-study pages ship at most the copy-button script (under 1 KB); no React.
- Each case study has Problem, Approach and Outcome sections and at least one metric, or is marked `status: draft` and excluded from the build and sitemap.
- Lighthouse SEO 100 on the index and one detail page; Rich Results Test recognizes `TechArticle` and `BreadcrumbList`.

**Risks and gotchas.**

- Moving files out of `src/pages/projects/` removes those routes; the `[slug].astro` route must produce identical slugs (the collection id is derived from the filename, so keep the filenames).
- `image()` in the schema requires the cover to be under `src/` (not `public/`) and referenced relatively; hotlinked URLs are rejected, which is the point.
- Long code blocks in the SSL case study will overflow on phones unless `pre` gets `overflow-x: auto` in the prose theme.
- Keep drafts out of `getStaticPaths` with a filter, otherwise placeholder projects go live.

**Rough effort.** 10 to 14 hours of development (two days), plus client time for the intake.

### Phase 8: Connect and Resume

**Goal.** A single-purpose page that sends a prospect to LinkedIn for the resume, or to Calendly, with no friction and nothing else to do.

**Depends on.** Phase 3, Phase 4 (for the `BookACall` block).

**Scope.**

- [ ] `src/pages/connect.astro`: h1 "Connect"; one paragraph: "The fastest way to reach me is LinkedIn. Connect there for my resume and a reply within a working day." (client to approve); a primary button "Connect on LinkedIn" (opens LinkedIn profile in a new tab, `simple-icons` glyph), secondary "GitHub"; then the `BookACall` block, collapsed to its two buttons with a "Prefer to talk? Book a call" heading.
- [ ] Resume handling per the brief: no PDF on the site by default. If the client later supplies a PDF (Open question 6), add `public/jimmy-lubega-resume.pdf`, a "Download resume (PDF, 120 KB)" secondary button with the file size in the label, and `noindex` on the PDF via a `X-Robots-Tag` header in `vercel.json`.
- [ ] "Also find me" row: any additional profiles the client wants (Credly, Posit Community, Stack Overflow) as icon links; otherwise omit the row.
- [ ] Optional email: the current data file deliberately omits email; keep it omitted unless the client asks (Open question 7). If added, render it as text with a copy button rather than a `mailto:` to reduce scraping, or as `mailto:` if the client prefers simplicity.
- [ ] `ContactPoint` added to the `Person` JSON-LD with `contactType: "sales"` and `url` set to the LinkedIn profile.

**Files created or modified.** `src/pages/connect.astro`, `src/components/connect/ConnectActions.astro` (new), `src/data/site.ts`, `vercel.json` (only if a PDF is added), delete `src/pages/contact.astro`.

**Acceptance criteria.**

- The LinkedIn button is the first focusable element after the header and the only primary button on the page.
- The page is under 1,000 words and ships 0 KB of JavaScript unless the Calendly popup enhancement is triggered.
- `/contact` redirects to `/connect` with a 301 (from Phase 0).
- External links carry `rel="noopener noreferrer"` and an "opens in new tab" visually hidden note.

**Risks and gotchas.**

- LinkedIn profile URLs with the numeric suffix (`jimmy-lubega-393652184`) are stable but ugly; ask the client to claim a custom URL and update `site.ts`.

**Rough effort.** 3 to 4 hours.

### Phase 9: Motion polish

**Goal.** Apply the Section 3.5 rules consistently across every page, and remove anything that moves without purpose.

**Depends on.** Phases 4 to 8.

**Scope.**

- [ ] `src/scripts/reveal.ts`: a vanilla helper using `inView` from `motion` that reveals elements marked `data-reveal` (and staggers children marked `data-reveal-group`) once, re-initialized on `astro:page-load`, no-op under reduced motion. Apply to section headers, card grids, the timeline and the credential grid. Keep it under 2 KB.
- [ ] Hover and focus feedback audit: buttons (background and 1 px lift), cards (border to `line-strong`, scrim lightens 6%), links (underline offset animates 150 ms), tags (no motion).
- [ ] Theme transition tuning: verify the 250 ms transition covers SVG `fill`/`stroke` in the topology and the bulb, and that images and code blocks (which are theme-invariant) do not flash.
- [ ] View transition tuning: confirm 200 ms crossfade; add `transition:name` to project card covers so the cover morphs into the case-study header on navigation (the one "delightful" transition on the site), with the fallback being the plain crossfade.
- [ ] Bulb micro-interaction: filament glow ramps over 250 ms, a 6 degree swing on the pull-cord glyph if one is used; nothing loops.
- [ ] Remove any remaining infinite animation (`animate-pulse`, `animate-spin`, custom keyframes) except the topology pulses and the 4 s cursor blink; grep the codebase to prove it.
- [ ] Document the motion rules in `docs/motion.md` with the tokens and the list of what animates.

**Files created or modified.** `src/scripts/reveal.ts` (new), all section components (add `data-reveal` attributes), `src/components/shell/ThemeToggle.astro`, `src/components/projects/ProjectCard.astro`, `src/layouts/CaseStudyLayout.astro`, `docs/motion.md`.

**Acceptance criteria.**

- With "Emulate prefers-reduced-motion: reduce", a full walk through every route shows zero animation and zero transition except instant state changes (recorded as a short screen capture attached to the PR).
- Without reduced motion, no element animates more than once per page load except the topology pulses and the cursor blink, and the cursor blink stops within 5 s.
- Frame rate during a reveal-heavy scroll on a mid-range Android profile (Chrome DevTools 4x CPU throttle) stays at or above 50 fps; no layout thrash (only `opacity` and `transform` animate).
- Total site JS after this phase: Home under 25 KB gzip, every other route under 4 KB gzip.

**Risks and gotchas.**

- `inView` observers must be disconnected on `astro:before-swap` or they accumulate across navigations.
- Morphing the cover image with `transition:name` requires the same name on exactly one element per page; duplicates break the transition silently.

**Rough effort.** 5 to 7 hours.

### Phase 10: Imagery and asset optimization

**Goal.** Source, license, process and serve the 4K project backgrounds and every other image through Astro's pipeline, with no third-party image requests.

**Depends on.** Phase 7 (schema) and Phase 1 (scrim token); can start sourcing in parallel with Phase 5.

**Scope.**

- [ ] Sourcing: for each case study select one photograph from Unsplash or Pexels at 3840 px or wider, matched to the subject: TLS and certificates (macro of fiber, a lock mechanism, a keyed switch panel), Linux hardening (a server-room corridor with cool light, cable management, a rack door), enterprise builds (rows of racks in perspective, a data hall). Preference for abstract, desaturated, low-clutter compositions with a dark region where text will sit. Save the license page URL, photographer and download date in the frontmatter `coverCredit` and in `docs/image-credits.md`. Exclude any image with a visible brand, face or readable screen.
- [ ] Also source a generic set of 4 to 6 spare backgrounds so future projects have covers on day one.
- [ ] Processing: store originals in `src/assets/projects/<slug>.jpg`; Astro emits AVIF and WebP with `widths={[640, 1024, 1600, 2560]}` and `sizes` per placement. No 3840 px output is served (no viewport needs more than 2560 CSS px at DPR 1, and DPR 2 phones are 800 to 1200 px wide). Use `getImage()` for CSS-background placements (card covers) and `<Picture>` for `<img>` placements (case-study headers), with `fetchpriority="high"` and `loading="eager"` only on the header image of the page being viewed.
- [ ] Treatment: covers sit under the `scrim` gradient (opaque at the text edge, 40% at the far edge) plus a 1 px `line` border and a subtle grain texture (a tiny tiled PNG at 4% opacity) so the photo reads as a surface rather than a stock photo. Theme-invariant: same treatment in light and dark.
- [ ] Headshot, badges and any diagrams through `astro:assets` with explicit dimensions.
- [ ] Favicon set: real multi-size `favicon.ico`, `favicon.svg` (updated monogram in the new type), `apple-touch-icon.png` 180 px, `site.webmanifest` with theme colors for both themes.
- [ ] Open Graph image: a static 1200x630 PNG in the new visual language for now; per-page generation is Phase 11.
- [ ] Delete the interim Unsplash references from Phase 0 and the `.project-hero` CSS if any survived.

**Files created or modified.** `src/assets/projects/*.jpg`, `src/assets/spare/*.jpg`, `src/assets/grain.png`, `src/content/projects/*.md` (cover fields), `src/components/projects/ProjectCard.astro`, `src/components/projects/CaseStudyHeader.astro`, `public/favicon.ico`, `public/favicon.svg`, `public/apple-touch-icon.png`, `public/site.webmanifest`, `public/og-image.png`, `docs/image-credits.md`.

**Acceptance criteria.**

- No request to `images.unsplash.com` or any third-party image host in the network panel on any route.
- The largest image transferred on the Projects index at 390 px wide is under 120 KB; on a case-study page at 1440 px the header image is under 350 KB (AVIF).
- Every image element has `width`, `height`, `alt` (empty `alt=""` only for purely decorative covers whose information is repeated in text) and produces zero CLS in Lighthouse.
- `docs/image-credits.md` lists every photograph with source URL, license name and date.
- Lighthouse Performance on the Projects index and a case study stays at or above 90 on mobile.

**Risks and gotchas.**

- Sharp on Windows occasionally needs a clean `npm ci` after Node upgrades; CI on Linux avoids this.
- AVIF encoding of six 4K originals adds build time (tens of seconds); acceptable, but do not add a hundred spare images.
- Unsplash's license prohibits compiling photos into a competing stock service, not this use; Pexels similar. Both prohibit implying endorsement by identifiable people; the selection rule above avoids people entirely.

**Rough effort.** 4 to 6 hours plus sourcing time (about 15 minutes per image).

### Phase 11: Accessibility and SEO hardening

**Goal.** Bring every route to a verified WCAG 2.2 AA baseline and a coherent structured-data model, and fix the metadata defects found in the audit.

**Depends on.** Phases 4 to 10.

**Scope.**

- [ ] Automated pass: `@axe-core/playwright` script under `scripts/a11y.mjs` running against `astro preview` for every route at 390 px and 1440 px in both themes; zero serious or critical violations is the gate. Add it to CI as a non-blocking job first, blocking once green.
- [ ] Manual pass: keyboard-only walkthrough of every route (documented in `docs/a11y-checklist.md`), screen reader spot check (NVDA on Windows) of Home, Book a Call and one case study, 200% zoom and 320 px reflow check, forced-colors mode check (Windows High Contrast) for the toggle and cards.
- [ ] Contrast: re-measure every token pair on `/design` after any Phase 1 tuning; document the table.
- [ ] Focus order and skip link target verified after view transitions (focus should move to `<main>` or the h1 on navigation; add `transition:persist` exceptions where needed).
- [ ] Structured data model: `WebSite` (with `name`, `url`), `Person` (Jimmy Lubega, `jobTitle`, `worksFor` purenest360 llc, `knowsAbout`, `sameAs`, `image`), `Organization` (purenest360 llc, `founder` Person), `ProfessionalService` (`provider` Organization, `areaServed`, `serviceType` rewritten for the brief's positioning: cloud infrastructure, Linux and automation, Kubernetes platforms, Posit Team deployment), `TechArticle` and `BreadcrumbList` per case study, `EducationalOccupationalCredential` per certification. Emitted from `JsonLd.astro` with one `@graph`.
- [ ] Metadata cleanup: remove `keywords`, `service`, `category`, `profile:*`; add `twitter:creator` if the client has an account (Open question 10); `og:locale`; `article:*` on case studies; per-theme `theme-color`; `rel="me"` on LinkedIn and GitHub links.
- [ ] Per-page Open Graph images generated at build with `satori` and `sharp` from an `og/[...slug].png.ts` endpoint (title, eyebrow, monogram, dark canvas), so each case study gets its own preview. Verify with the LinkedIn Post Inspector once live.
- [ ] `sitemap` configuration: exclude `/design` and `/404`, set `changefreq` and `lastmod` from git or frontmatter; `robots.txt` generated from `site` so the two cannot disagree.
- [ ] Headings audit: exactly one `h1` per page, no skipped levels, no heading used for styling (the 10 px `h2` on `/book` is gone).
- [ ] Language and copy: `lang="en"`, sentence-case headings, no em-dashes (`grep -rnP "\x{2014}" src docs README.md` returns nothing), link text that makes sense out of context.

**Files created or modified.** `scripts/a11y.mjs` (new), `.github/workflows/ci.yml`, `docs/a11y-checklist.md`, `src/components/seo/{Seo,JsonLd}.astro`, `src/pages/og/[...slug].png.ts` (new), `astro.config.mjs` (sitemap options), `public/robots.txt` (or generated), `src/layouts/BaseLayout.astro`.

**Acceptance criteria.**

- axe reports zero serious or critical issues on every route, both themes, both widths.
- Lighthouse Accessibility 100 and SEO 100 on every route (preview build).
- Google Rich Results Test recognizes `Person`, `Organization`, `BreadcrumbList` and `TechArticle` with no errors; Schema.org validator shows one connected `@graph`.
- LinkedIn Post Inspector shows the correct title, description and per-page image for Home and one case study.
- The manual checklist is completed and committed with the date and the tester's initials.

**Risks and gotchas.**

- `satori` needs the font files as buffers at build time; reuse the self-hosted Plex files from the Fonts API cache or vendor two static TTFs for the OG endpoint only.
- axe cannot judge alt-text quality; the manual pass must.
- Windows High Contrast removes backgrounds; the theme toggle and status dots need `forced-color-adjust` handling or an outline.

**Rough effort.** 5 to 7 hours.

### Phase 12: Performance budget, build and deploy

**Goal.** Lock in the performance characteristics, make the build reproducible in CI, and get the finished site deployed on Vercel ready for the domain switch.

**Depends on.** Phases 0 to 11.

**Scope.**

- [ ] Define the budget in `docs/performance-budget.md` and enforce it in CI with a small script that reads `dist/`: Home JS under 25 KB gzip, other routes under 4 KB gzip, CSS under 15 KB gzip, largest image per route as in Phase 10, HTML under 25 KB gzip per page, total fonts under 120 KB.
- [ ] Lighthouse CI (`@lhci/cli`) in the workflow against `astro preview` for Home, About, Projects, one case study and Connect, with assertions: Performance at or above 95 mobile, Accessibility 100, Best Practices 100, SEO 100.
- [ ] Caching headers in `vercel.json`: immutable long cache for `/_astro/*`, short cache for HTML; `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a Content-Security-Policy that allows Calendly's popup (`assets.calendly.com` script, `calendly.com` frame) and nothing else third-party. Test the CSP in report-only first.
- [ ] Vercel project: confirm the Git integration deploys `main` on push (the live site currently lags HEAD; find out why: disconnected repo, failed build, or manual deploy) and that preview deployments run on PRs.
- [ ] Analytics: enable Vercel Web Analytics (`@vercel/analytics/astro`, cookie-free, no consent banner needed) or, if the client prefers a vendor-neutral option, Plausible with the script loaded via `is:inline` and `defer`. Record the choice (Open question 11).
- [ ] Scheduled rebuild: a GitHub Actions cron (monthly) that hits a Vercel deploy hook so build-time computations (certification expiry) refresh.
- [ ] Final `README.md`: how to add a project, a certification, change Calendly links, change theme defaults, run checks, and the deployment and domain runbook pointer.
- [ ] Tag the release `v1.0.0` on `main` once the client signs off on the preview URL.

**Files created or modified.** `docs/performance-budget.md`, `scripts/budget.mjs` (new), `.github/workflows/ci.yml`, `lighthouserc.json` (new), `vercel.json`, `.github/workflows/rebuild.yml` (new), `README.md`, `astro.config.mjs` (analytics if applicable).

**Acceptance criteria.**

- CI is green on `main` with budget and Lighthouse assertions passing.
- A push to `main` produces a production deployment on Vercel within the integration; a PR produces a preview URL.
- `securityheaders.com` grade A on the preview URL; the Calendly popup still opens under the enforced CSP.
- Analytics events appear for a test visit and no cookie banner is required by the chosen tool.
- The client has approved the preview URL in writing (email or LinkedIn message) before Phase 13 begins.

**Risks and gotchas.**

- Vercel's build image Node version must match `engines`; set it in project settings to 22.x.
- A strict CSP breaks inline scripts unless they carry a nonce or hash; Astro's inline theme script needs a hash entry, and the hash changes whenever the script changes. Keep the script stable or use `'unsafe-inline'` for `script-src` only if the hash approach proves brittle, and document the tradeoff.

**Rough effort.** 4 to 6 hours.

### Phase 13: Domain and DNS (human task for the developer)

**Goal.** Register `jlpro-po.com`, point it at the finished site, and end with the domain owned by Jimmy's Cloudflare account. No part of this phase is automated and none of it was performed during this audit.

**Depends on.** Phase 12 (client-approved production deployment). **Client prerequisites:** confirmation of the exact domain string (Open question 1), and the Cloudflare account under `jimmylubega.pro@gmail.com` created and verified by Jimmy.

**Recommended path: register directly in the client's account.** Cloudflare Registrar has no self-service "move this domain to another Cloudflare account" action; moving a registered domain between accounts requires a support request, and a transfer to a different registrar is blocked for 60 days after registration by ICANN rules. Registering the domain in Jimmy's own account from the start avoids both, and still lets the developer do all the configuration.

**Scope.**

- [ ] Jimmy creates (or confirms) the Cloudflare account for `jimmylubega.pro@gmail.com`, enables two-factor authentication, and adds a payment method (Cloudflare Registrar charges at-cost, currently around $10 to $11 per year for `.com`).
- [ ] Jimmy invites the developer as an account member with the "Administrator" role scoped to this account, or, if he prefers not to, performs the registration step himself on a shared screen while the developer talks him through it.
- [ ] Check availability of `jlpro-po.com` in Cloudflare Registrar (at audit time the domain has no DNS records, which is consistent with unregistered but is not proof; the registrar search is authoritative). If unavailable, stop and consult the client (Open question 1 lists alternatives).
- [ ] Register `jlpro-po.com` for 1 year with auto-renew on, WHOIS redaction on (default), and the registrant contact set to Jimmy's details. Registrar lock on.
- [ ] In Vercel, add `jlpro-po.com` and `www.jlpro-po.com` to the project; Vercel shows the exact records it wants. Historically these are an `A` record at the apex pointing to `76.76.21.21` and a `CNAME` for `www` pointing to `cname.vercel-dns.com`, but Vercel has changed its recommended values before, so use the values shown in the Vercel dashboard on the day.
- [ ] In Cloudflare DNS for the zone: add those records with the proxy **off** (grey cloud, "DNS only") so Vercel can issue and renew the TLS certificate itself and there is no double proxy. Delete any placeholder records Cloudflare auto-creates.
- [ ] Set the canonical host: `jlpro-po.com` apex as primary, with `www` redirecting to apex (configure in Vercel's domain settings). Update `site` in `astro.config.mjs` to `https://jlpro-po.com` if not already, rebuild, and confirm canonical tags and the sitemap use it.
- [ ] Email: the domain will have no mail; add a null MX and an SPF record `v=spf1 -all` plus a `DMARC` record `v=DMARC1; p=reject` so the domain cannot be used for spoofing. (If Jimmy later wants `hello@jlpro-po.com`, Cloudflare Email Routing to his Gmail is free and can be added then.)
- [ ] Optional: enable Cloudflare's DNSSEC for the zone (Cloudflare Registrar supports one-click DNSSEC).
- [ ] Verify: `https://jlpro-po.com` serves the site with a valid certificate; `http://` and `www` redirect; `curl -I` shows the security headers from Phase 12; Google Search Console property added for the new domain with the sitemap submitted; LinkedIn Post Inspector re-run on the new URL.
- [ ] Old host: decide what happens to `jimmylubega.com` (Open question 2). If it stays with Jimmy, configure a 308 redirect from it to `jlpro-po.com` in Vercel so existing links and any search equity carry over; if it is being dropped, let it lapse after the redirect has run for a few months.
- [ ] Handover: remove the developer's Cloudflare membership (or downgrade to read-only) once verified; confirm Jimmy can log in, sees the domain under Domain Registration, and has auto-renew and the payment method in place. Write `docs/domain-runbook.md` recording every record and setting.

**Fallback path, only if the client insists the developer purchases it:** register in the developer's Cloudflare account, complete all steps above, then open a Cloudflare support ticket requesting a domain move to the client's account (both account emails and the domain in the ticket; Cloudflare will ask both parties to confirm). Expect days, not minutes. Do not attempt a registrar transfer out and back in; the 60-day lock applies and it costs a year's renewal.

**Files created or modified.** `astro.config.mjs` (`site`), `docs/domain-runbook.md`. Everything else lives in Cloudflare and Vercel dashboards.

**Acceptance criteria.**

- `jlpro-po.com` resolves, serves the approved build over HTTPS with an A+ on SSL Labs, `www` and `http` redirect to the apex, and Search Console shows the sitemap as processed.
- The domain appears under Domain Registration in Jimmy's Cloudflare account with auto-renew enabled, registrar lock on, and Jimmy as registrant.
- `docs/domain-runbook.md` lists every DNS record and every Vercel domain setting.
- The developer no longer holds administrative access to the client's Cloudflare account unless the client asks otherwise.

**Risks and gotchas.**

- Enabling the orange-cloud proxy on the Vercel records causes certificate issuance failures or redirect loops unless SSL mode is set to Full (strict); DNS-only avoids the whole class of problems.
- Cloudflare's WHOIS contact email must be verified within 15 days of registration or the domain is suspended; make sure Jimmy watches for that email.
- ICANN's 60-day inter-registrar transfer lock starts at registration and again at any registrant contact change; keep the registrant details correct on day one.

**Rough effort.** 2 to 3 hours of active work spread over several days of propagation and confirmations.

### Effort summary

| Phase | Name                         | Hours               |
| ----- | ---------------------------- | ------------------- |
| 0     | Tooling and baseline         | 3 to 4              |
| 1     | Design system foundation     | 6 to 8              |
| 2     | Theme system                 | 4 to 6              |
| 3     | Global shell                 | 6 to 8              |
| 4     | Home and Book a Call         | 10 to 14            |
| 5     | About                        | 4 to 6              |
| 6     | Education and Certifications | 4 to 5              |
| 7     | Projects                     | 10 to 14            |
| 8     | Connect and Resume           | 3 to 4              |
| 9     | Motion polish                | 5 to 7              |
| 10    | Imagery and assets           | 4 to 6 (+ sourcing) |
| 11    | Accessibility and SEO        | 5 to 7              |
| 12    | Performance, build, deploy   | 4 to 6              |
| 13    | Domain and DNS               | 2 to 3 (+ waiting)  |
|       | **Total**                    | **70 to 98 hours**  |

---

## 5. Out of scope and client-dependent items

These block specific phases and can only come from Jimmy.

1. **Calendly correction (blocks Phase 4).** In Calendly: remove the $100 Stripe collection from the `30min` event (or confirm it was intentional), add $100 collection to the `1-hour` event, and consider renaming the events to "Discovery Consultation (30 min, free)" and "Working Session (60 min, $100)" so the widget title matches the site. Confirm the final prices; the site currently says $80 for the hour, the brief says $100, Calendly says $0.
2. **Case-study intake (blocks Phase 7 content).** One completed intake template per project (Section 4, Phase 7), for the three existing projects at minimum and ideally two or three more. Confirm what may be named publicly.
3. **About confirmation.** The provided paragraph is used as-is; approve the surrounding copy in `docs/copy/about.md`, the "How I work" principles, and a `current` line.
4. **Certifications detail (blocks Phase 6).** For each of the five certifications: issuer, issue date, expiry date, credential ID or Credly URL, and whether the badge image may be shown. Any certifications not yet in `profile.ts`.
5. **Headshot (Phase 5, Home).** One photograph, at least 1600 px on the short side, neutral background preferred, with confirmation of usage rights if a photographer took it.
6. **Resume handling (Phase 8).** Confirm "LinkedIn only" (current reading of the brief) or supply a PDF. If PDF: confirm it contains no home address or phone number.
7. **Email exposure (Phase 8).** Confirm that no email address should appear on the site (current data deliberately omits it).
8. **Logos and marks.** Confirm which employer or client names may appear (Posit PBC, Dominion Energy, Katalyze Data, National Vision) and whether any client logos may be displayed. Default: names in text only, no client logos.
9. **Statistics for the proof strip (Phase 4).** Confirm "400+ physical servers" and "2,000+ VMs" can be stated on the home page, and the years-of-experience figure.
10. **Domain (Phase 13).** Confirm the exact domain, create the Cloudflare account, decide the future of `jimmylubega.com`.
11. **Copy approval.** All drafted copy lives in `docs/copy/*.md` and needs a yes before each section ships.

---

## 6. Open questions

1. The brief names `jlpro-po.com`; the config has cycled through `jimmylubega.com`, `purenest360llc.com` and `jlpro.com`. Is `jlpro-po.com` final? If it is unavailable, what is the fallback (`jlpro.io`, `jimmylubega.pro`, `purenest360.com`)?
2. `jimmylubega.com` is live on Vercel with this site today. Does Jimmy own it, and should it redirect to the new domain or be dropped?
3. Theme precedence: the plan treats an explicit OS dark preference as authoritative and lets time of day decide for everyone whose OS reports light (Phase 2). The alternative is "system preference always wins", which makes time of day a dead feature in practice. Which does Jimmy want? And is 19:00 to 07:00 the right dark window?
4. Should a manual theme choice persist forever (current plan, with a "Reset to automatic" control) or expire, for example after 24 hours?
5. Positioning: the current site leads with Posit Team support (JSON-LD, hero subtitle); the brief leads with Cloud, Linux, Automation and Kubernetes. The plan follows the brief and lists Posit as one capability. Correct?
6. Resume: LinkedIn only, or also a PDF download?
7. Should any email address appear on the site?
8. Blog: the current `/blog` page (one essay) was not requested. Remove it with a redirect to Home (plan default), keep it as an unlisted page, or turn it into a "Notes" section for future writing?
9. May the home page state "400+ physical servers" and "2,000+ VMs" as headline numbers, and what is the years-of-experience figure to show?
10. Does Jimmy have an X/Twitter, Credly, or other public profile to include for `twitter:creator` and the "Also find me" row?
11. Analytics: Vercel Web Analytics (simplest, cookie-free, tied to Vercel) or a vendor-neutral tool such as Plausible (small monthly cost)?
12. Hosting: the site is on Vercel and the plan keeps it there. Any preference for Cloudflare Pages instead, given the domain will live at Cloudflare? (Astro supports both; switching is a half-day and would move Phase 12's headers and analytics choices.)
13. Icons: is the client comfortable with vendor glyphs (AWS, Azure, Kubernetes, Terraform) appearing as "works with" indicators? The plan says yes, in their standard forms, never recolored.
14. Which brand name should carry the site: "Jimmy Lubega" (plan default, with "purenest360 llc" in the footer and legal metadata) or "purenest360 llc" as the primary?
15. Is the `j-lubega` GitHub profile the one to link, and does it have public repositories worth surfacing on Projects?

---

## Changelog

| Version | Date       | Author                         | Change                                                                   |
| ------- | ---------- | ------------------------------ | ------------------------------------------------------------------------ |
| 1.0     | 2026-09-13 | Jonathan Mukhobe (with Claude) | Initial audit, design direction and phased plan against commit `0335166` |
