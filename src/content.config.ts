/**
 * Content collections. Adding a project is one Markdown file with valid frontmatter;
 * adding a certification is one JSON object. Zod turns a missing or malformed field
 * into a build error that names the field, instead of "undefined" on the page.
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

/** YYYY-MM, or "pending" while the client confirms a date. */
const yearMonth = z.union([
  z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM'),
  z.literal('pending'),
]);

export const projectTags = [
  'cloud',
  'linux',
  'automation',
  'kubernetes',
  'security',
  'posit',
  'observability',
] as const;

const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(8).max(90),
      summary: z.string().min(40).max(200),
      /** Named client, or the sector when the client is confidential. */
      client: z.string().optional(),
      sector: z.string().optional(),
      role: z.string(),
      period: z.object({ start: yearMonth, end: yearMonth.or(z.literal('present')) }).optional(),
      status: z.enum(['completed', 'ongoing', 'draft']).default('completed'),
      stack: z.array(z.string()).min(1),
      tags: z.array(z.enum(projectTags)).min(1),
      problem: z.string().min(40).max(320),
      approach: z.string().min(40).max(320),
      outcome: z.string().min(40).max(320),
      metrics: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .min(1)
        .max(4),
      /** 4K background under src/assets/projects; optional until Phase 10 sources one per project. */
      cover: image().optional(),
      coverAlt: z.string().default(''),
      coverCredit: z.object({ author: z.string(), source: z.string(), url: z.url() }).optional(),
      /** ISO date for article metadata; omit if unknown. */
      publishedAt: z.coerce.date().optional(),
      featured: z.boolean().default(false),
      order: z.number().int().default(100),
    }),
});

const certifications = defineCollection({
  loader: file('./src/content/certifications.json'),
  schema: z.object({
    name: z.string(),
    /** Short label for chips and the Home strip. */
    short: z.string(),
    issuer: z.string(),
    issuerIcon: z.string().optional(),
    issued: yearMonth,
    expires: yearMonth.optional(),
    credentialId: z.string().optional(),
    verifyUrl: z.url().optional(),
    /** Badge image path relative to this file, when the client has confirmed display permission. */
    badge: z.string().optional(),
    level: z.string().optional(),
    tags: z.array(z.string()).default([]),
    order: z.number().int().default(100),
  }),
});

const education = defineCollection({
  loader: file('./src/content/education.json'),
  schema: z.object({
    degree: z.string(),
    field: z.string().optional(),
    institution: z.string(),
    location: z.string().optional(),
    years: z.string().optional(),
    url: z.url().optional(),
    notes: z.array(z.string()).default([]),
  }),
});

export const collections = { projects, certifications, education };
