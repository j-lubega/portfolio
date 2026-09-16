import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';
import { site } from '../../data/site';

/**
 * Per-page Open Graph images, generated at build time. The plan called for satori (an HTML/CSS
 * layout engine) plus sharp; this deviates to sharp rendering SVG text directly, because the
 * design here is flat and typographic (eyebrow, title, subtitle, a footer line), which SVG <text>
 * covers without pulling in a second rendering engine or vendoring font files as buffers. The
 * tradeoff, noted honestly: SVG text rendering depends on fonts available to the machine running
 * the build (via fontconfig/librsvg), so the exact typeface can differ between this Windows dev
 * machine and a Linux CI runner. The generic "sans-serif" keyword alone rendered as a serif font
 * on this machine's bundled libvips/librsvg (no fontconfig alias for it), so the sans stack names
 * concrete fonts (Arial first, then common Linux equivalents) ending in the generic as a last
 * resort; "monospace" resolved correctly on its own and is left as-is. Re-check the rendered PNGs
 * after any change here, on whatever machine actually runs the build.
 */

type Page = { slug: string; eyebrow: string; title: string; subtitle: string };

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Greedy word-wrap for the title, sized to fit the 1040px-wide text block at this font size. */
function wrapTitle(title: string, maxCharsPerLine = 24): string[] {
  const words = title.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function renderSvg({ eyebrow, title, subtitle }: Page): string {
  const lines = wrapTitle(title);
  const titleStartY = 260 - (lines.length - 1) * 34;
  const titleTspans = lines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 78}">${escapeXml(line)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0b1220" />
  <rect x="0" y="0" width="1200" height="4" fill="#5ee1ff" />
  <text x="80" y="120" font-family="monospace" font-size="26" fill="#5ee1ff">${escapeXml(eyebrow)}</text>
  <text x="80" y="${titleStartY}" font-family="Arial, Helvetica, Liberation Sans, DejaVu Sans, sans-serif" font-size="66" font-weight="700" fill="#e6edf7">${titleTspans}</text>
  <text x="80" y="${titleStartY + lines.length * 78 + 20}" font-family="Arial, Helvetica, Liberation Sans, DejaVu Sans, sans-serif" font-size="32" fill="#a5b1c5">${escapeXml(subtitle)}</text>
  <text x="80" y="560" font-family="monospace" font-size="22" fill="#7686a0">${escapeXml(site.domain)}</text>
  <circle cx="982" cy="553" r="6" fill="#4ade80" />
  <text x="1120" y="560" text-anchor="end" font-family="monospace" font-size="20" fill="#7686a0">operational</text>
</svg>`;
}

const staticPages: Page[] = [
  { slug: 'home', eyebrow: '$ whoami', title: 'Jimmy Lubega', subtitle: site.role },
  {
    slug: 'about',
    eyebrow: '// about',
    title: "Hello, I'm Jimmy.",
    subtitle: 'Cloud Infrastructure, Linux, Automation, Kubernetes',
  },
  {
    slug: 'education',
    eyebrow: '$ cat credentials.json',
    title: 'Education and certifications',
    subtitle: 'Kubernetes, AWS, Security+, Linux',
  },
  {
    slug: 'projects',
    eyebrow: '$ ls ./projects',
    title: 'Projects',
    subtitle: 'Cloud infrastructure and platform engineering case studies',
  },
  {
    slug: 'connect',
    eyebrow: '$ ssh jimmy@linkedin',
    title: 'Connect',
    subtitle: 'LinkedIn for a resume, or book a call',
  },
  {
    slug: 'book',
    eyebrow: '$ calendly --list',
    title: 'Book a call',
    subtitle: 'Free discovery call, or a paid working session',
  },
];

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getCollection('projects', ({ data }) => data.status !== 'draft');
  const projectPages: Page[] = projects.map((p) => ({
    slug: `projects/${p.id}`,
    eyebrow: p.data.status === 'completed' ? '// completed' : '// case study',
    title: p.data.title,
    subtitle: p.data.client ?? p.data.sector ?? site.role,
  }));
  return [...staticPages, ...projectPages].map((page) => ({
    params: { slug: page.slug },
    props: page,
  }));
};

export const GET: APIRoute<Page> = async ({ props }) => {
  const svg = renderSvg(props);
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
