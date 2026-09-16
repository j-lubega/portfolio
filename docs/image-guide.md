# Image guide: where to put your photos

Every image slot on the site works by **filename convention**: save a file at the exact path
below, using one of the listed extensions, and it appears on the site automatically at the next
build. No code edit and no frontmatter edit needed. Nothing you have not supplied ever gets
replaced with a stock photo; a slot with no file just renders its honest fallback (a monogram for
the headshot, a dotted grid for a project cover), which is what the live site does today.

Run `npm run build` (or restart `npm run dev`) after adding a file so Astro picks it up.

## 1. Headshot (About page hero)

**Path:** `src/assets/headshot.jpg` (`.jpeg`, `.png` and `.webp` also work; use whichever the
original file already is rather than converting)

- Used on: `/about`, top of the page, right column, and as the `image` on your Person structured
  data (the entry Google and LinkedIn can show for you).
- Recommended: at least 1600 px on the short side, a 4:5 portrait crop (the frame is
  `aspect-ratio: 4 / 5`, so a square or landscape photo gets cropped from the center; a 4:5 original
  avoids that), neutral or softly blurred background, good even lighting, no sunglasses or heavy
  filter.
- This is the one slot on the site with a face in it. Everywhere else (project covers) faces are
  deliberately excluded.

Until this file exists, the page shows a monogram-and-topology placeholder, never a stock photo of
a person.

## 2. Project cover photographs

**Path:** `src/assets/projects/<project-id>.<ext>`, any of `.jpg`, `.jpeg`, `.png`, `.webp`

The `<project-id>` is the Markdown filename without `.md`, which is also the URL slug. The
extension does not matter and does not need to match anything in code: delete the old file and
save the new one under the same `<project-id>`, whatever extension it already has (`.jpg`,
`.jpeg`, `.png` or `.webp`), and the site picks it up at the next build with no other change. Keep
only one file per `<project-id>` at a time; if both a `.jpg` and a `.jpeg` exist for the same
project, which one wins is unspecified.

| Project                                       | Exact path (extension may vary, see above)                  | Current state                                           |
| --------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| Self-signed TLS for Posit Team on Rocky Linux | `src/assets/projects/posit-ssl.jpg`                         | Has a cover; replace anytime by saving over this path   |
| Linux server hardening and SELinux operations | `src/assets/projects/linux-hardening-selinux.jpg`           | Has a cover; replace anytime by saving over this path   |
| Enterprise infrastructure builds at scale     | `src/assets/projects/enterprise-infrastructure-builds.jpeg` | Interim placeholder cover (see `docs/image-credits.md`) |

- Used on: the project's card on `/projects` and the full-bleed header on its own page.
- Recommended: 3840 px wide or more (4K), landscape, a dark or shadowed region on the left third
  where the title and metadata sit (the card and header both put text on a dark scrim over the left
  and bottom of the image, strongest at the text edge). See "Adjusting the photo's brightness and the dark shadow on top" below
  if a specific photo needs a different balance.
- Subject matter suggestions from the plan: TLS and certificates (macro of fiber optics, a lock
  mechanism, a keyed switch panel); Linux hardening (a server-room corridor, cable management, a
  rack door); enterprise builds (rows of racks in perspective, a data hall, the existing interim
  photo).
- Avoid: visible brand logos, readable screens or text, recognizable faces. Unsplash and Pexels
  licenses both prohibit implying endorsement by an identifiable person, and a generic infrastructure
  photo ages better than one tied to a specific vendor's hardware.
- Once you place a file, add its credit to `docs/image-credits.md` (source URL, license, download
  date) so the site stays honest about where its imagery comes from.

## 3. Spare project backgrounds (optional, for future projects)

**Path:** `src/assets/projects/_spare/<anything>.jpg` (as many as you like, `.jpeg`/`.png`/`.webp`
also work)

If a new project is added later without its own cover yet, the site automatically assigns it one
of these spares (consistently, the same project always gets the same spare) instead of falling
straight to the dotted grid. Entirely optional: skip this folder and new projects without a named
cover simply get the dotted-grid treatment until you add one.

## 4. Favicon and app icons

Already generated and in place at `public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png`,
`icon-192.png` and `icon-512.png`: a dark rounded square with "JL" in the site's mono font and
accent color. If you want a different mark (a real logo, for instance), replace
`public/favicon.svg` with your own square SVG and re-run the generator:

```bash
node scripts/gen-favicons.cjs
```

## 5. Open Graph preview image

Per-page social preview images are generated automatically at build time (Phase 11) from each
page's title, no photo needed. The one static fallback is `public/og-image.png`; it is only used
if a page-specific one is ever missing.

## Adjusting the photo's brightness and the dark shadow on top

Every project cover has two independent controls, each a single number, set right at the top of
the `<style>` block in the two files that render a cover:

- `src/components/projects/ProjectCard.astro` (the card on `/projects`)
- `src/components/projects/CaseStudyHeader.astro` (the full-width banner on the project's own page)

```css
.project-card {
  /* how visible the raw photo is: 0 (invisible) to 1 (full brightness, the default) */
  --cover-opacity: 1;
  /* how strong the black shadow on top is: 0 (none) to 1 (default) up to about 1.4 (much darker) */
  --scrim-strength: 1;
}
```

(`CaseStudyHeader.astro` has the identical two lines under `.case-header` instead of `.project-card`.)

- **`--cover-opacity`** fades the photo itself toward the dark canvas color behind it. Lower this
  (try `0.7` or `0.5`) if a photo is too loud, too saturated, or too busy even with the shadow at
  its strongest.
- **`--scrim-strength`** controls the dark gradient that sits on top of the photo so the title and
  text stay readable. `1` is the design's default; raise it (try `1.2` to `1.4`) for a bright or
  busy photo where text is getting lost; lower it (try `0.5` to `0.7`) to let more of a photo that
  is already dark show through.

Change the number, save, and `npm run dev` picks it up immediately (or rebuild). Both apply per
file, so they affect every project's card or header the same way; there is no separate switch per
project today. After changing a value, check contrast with the browser's color picker on the
darkest and lightest parts of the title text: it should read at least 4.5:1 against the pixel
directly behind it, the same way `docs/a11y-checklist.md` checked the shipped defaults.

If a specific photo is unreadable no matter how the two numbers are set (very bright, very busy, or
its main subject sits exactly where the title lands), the more reliable fix is choosing a photo
with more empty, darker space in that region in the first place, per the "dark region where text
will sit" guidance above, rather than pushing `--scrim-strength` so high the photo stops reading as
a photo.

<details>
<summary>How the shadow is actually built, if you want to go further than the one number</summary>

`--scrim-strength` scales a three-stop gradient (`.project-card__scrim` / `.case-header__scrim`,
just below the two variables) that goes from lighter near the photo's edge to fully opaque behind
the text, using the `--scrim` color token (`rgb(5 10 20 / 0.72)`, in `src/styles/tokens.css`). Each
stop is written as `color-mix(in srgb, var(--scrim) calc(X% * var(--scrim-strength)), transparent)`,
where `X` is that stop's own darkness at the default strength of `1`. To change the _shape_ of the
shadow rather than its overall strength (for example, made it fade in sooner or later across the
image), edit the `X%` numbers or the `0%`/`45%`/`100%` (or `55%`) position values directly, the
same as before this section was added; `--scrim-strength` just multiplies whatever is there.

</details>
