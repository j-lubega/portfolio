# Baseline: 2026-09-13

Captured against `npm run build` + `astro preview --port 4322` at commit `0335166` (main), before any redesign work.

- Screenshots: `screenshots/<route>.<mobile-390|desktop-1440>.png` (full page, Chrome via `scripts/baseline.mjs`)
- Lighthouse: `lighthouse/<route>.<mobile|desktop>.report.{html,json}` (Lighthouse 13, `npx lighthouse@13`, mobile = default emulation, desktop = `--preset=desktop`)

## Scores

| Route | Form factor | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | desktop | 86 | 100 | 100 | 100 | 1.5 s | 0.001 | 0 ms |
| `/` | mobile | 78 | 100 | 100 | 100 | 3.6 s | 0.000 | 0 ms |
| `/blog` | desktop | 72 | 100 | 100 | 100 | 2.2 s | 0.001 | 0 ms |
| `/blog` | mobile | 65 | 100 | 100 | 100 | 4.7 s | 0.000 | 0 ms |
| `/book` | desktop | 78 | 95 | 77 | 100 | 2.0 s | 0.000 | 0 ms |
| `/book` | mobile | 68 | 95 | 77 | 100 | 4.5 s | 0.000 | 0 ms |
| `/contact` | desktop | 91 | 100 | 100 | 100 | 1.2 s | 0.003 | 0 ms |
| `/contact` | mobile | 96 | 100 | 100 | 100 | 2.2 s | 0.002 | 0 ms |
| `/projects` | desktop | 77 | 100 | 100 | 100 | 1.8 s | 0.000 | 0 ms |
| `/projects` | mobile | 88 | 100 | 100 | 100 | 3.1 s | 0.009 | 0 ms |
| `/projects/enterprise-infrastructure-builds` | desktop | 63 | 100 | 100 | 100 | 5.9 s | 0.009 | 0 ms |
| `/projects/enterprise-infrastructure-builds` | mobile | 58 | 100 | 100 | 100 | 11.0 s | 0.059 | 0 ms |
| `/projects/linux-hardening-selinux` | desktop | 80 | 95 | 100 | 100 | 1.7 s | 0.001 | 0 ms |
| `/projects/linux-hardening-selinux` | mobile | 85 | 95 | 100 | 100 | 2.4 s | 0.015 | 0 ms |
| `/projects/posit-ssl` | desktop | 81 | 100 | 100 | 100 | 2.5 s | 0.005 | 0 ms |
| `/projects/posit-ssl` | mobile | 67 | 100 | 100 | 100 | 4.7 s | 0.000 | 0 ms |

## How to re-run

```bash
npm run build && npx astro preview --port 4322
npm run baseline -- http://localhost:4322 docs/baseline/<date>/screenshots
# per route, per form factor:
npx lighthouse@13 http://localhost:4322/ --preset=desktop --output=json --output=html --output-path=docs/baseline/<date>/lighthouse/home.desktop --chrome-flags="--headless=new"
```
