/**
 * Convention-based image lookup: drop a file at the documented path and it appears on the site
 * with no code or frontmatter change. `import.meta.glob(..., { eager: true })` resolves every
 * matching file at build time; a missing file simply means an empty map entry, so nothing breaks
 * when an image has not been supplied yet (see docs/image-guide.md for exact paths).
 */
import type { ImageMetadata } from 'astro';

type ImageModule = { default: ImageMetadata };

const projectCoverModules = import.meta.glob<ImageModule>(
  '/src/assets/projects/*.{jpg,jpeg,png,webp}',
  { eager: true }
);
const spareModules = import.meta.glob<ImageModule>(
  '/src/assets/projects/_spare/*.{jpg,jpeg,png,webp}',
  { eager: true }
);
const headshotModules = import.meta.glob<ImageModule>('/src/assets/headshot.{jpg,jpeg,png,webp}', {
  eager: true,
});

function basename(path: string): string {
  return path
    .split('/')
    .pop()!
    .replace(/\.[^.]+$/, '');
}

/** Auto-discovered project covers, keyed by the collection id (the Markdown filename). */
export const autoProjectCovers: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(projectCoverModules).map(([path, mod]) => [basename(path), mod.default])
);

/** Generic backgrounds for projects with no cover of their own yet (docs/image-guide.md). */
const spares: ImageMetadata[] = Object.keys(spareModules)
  .sort()
  .map((path) => spareModules[path].default);

/** The headshot, if src/assets/headshot.{jpg,jpeg,png,webp} exists; undefined otherwise. */
export const headshot: ImageMetadata | undefined = Object.values(headshotModules)[0]?.default;

/**
 * Resolve a project's cover: explicit frontmatter wins, then a file named for the project's id,
 * then a spare background (assigned deterministically by id so a project keeps the same spare
 * across builds), then undefined (the dotted-grid fallback in ProjectCard and CaseStudyHeader).
 */
export function resolveCover(id: string, explicit?: ImageMetadata): ImageMetadata | undefined {
  if (explicit) return explicit;
  if (autoProjectCovers[id]) return autoProjectCovers[id];
  if (spares.length === 0) return undefined;
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return spares[hash % spares.length];
}
