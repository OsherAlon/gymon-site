/**
 * Blog articles — one Markdown file per article per language.
 * The full file format (for the n8n agent that writes them) is in README.md.
 *
 *   src/content/blog/<lang>/<slug>.md        real articles
 *   src/content/blog/mock/<lang>/<slug>.md   mock articles (`mock: true`) — delete the folder to remove them
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { validateArticle } from './lib/article/validate.mjs';
import type { ArticleData } from './lib/article/types';

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    // The same slug exists once per language, so the id has to include the language.
    generateId: ({ data }) => `${data.lang}/${data.slug}`,
  }),
  schema: z.object({
    title: z.string().min(1),
    /** Optional short title (2–4 words) for the article hero. Falls back to the first 3 words of `title`. */
    heroTitle: z.string().min(1).optional(),
    description: z.string().min(1),
    /** Path under public/ (e.g. `/blog/my-slug.jpg`) or an absolute https URL. */
    image: z.string().min(1),
    imageAlt: z.string().optional(),
    createdAt: z.coerce.date(),
    author: z.string().min(1),
    /** Minutes. */
    readTime: z.number().int().positive(),
    lang: z.enum(['en', 'he']),
    /** URL slug AND translation key: the en and he versions of one article share it. */
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase latin letters, digits and dashes'),
    draft: z.boolean().default(false),
    mock: z.boolean().default(false),
  }),
});

/**
 * Doctrine articles — one JSON file per article per language, in the closed schema of
 * src/lib/article/schema.mjs (ARTICLE_UX_DOCTRINE §8b). This is what the n8n workflow
 * commits on Approve. The build runs the SAME validator the workflow runs before the review
 * email; any error fails the build.
 *
 *   src/content/articles/<lang>/<slug>.json          real articles (reviewed)
 *   src/content/articles/sample/<lang>/<slug>.json   sample articles (`sample: true` → noindex)
 */
const articles = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './src/content/articles',
    generateId: ({ data }) => `${data.lang}/${data.slug}`,
  }),
  schema: z
    .any()
    .superRefine((data, ctx) => {
      const { errors, warnings } = validateArticle(data, { mode: 'build' });
      for (const e of errors) ctx.addIssue({ code: 'custom', message: `${e.path}: ${e.message}` });
      if (warnings.length && !errors.length)
        console.warn(`[articles] ${data?.lang}/${data?.slug}: ${warnings.length} warning(s)\n  ` + warnings.map((w) => `${w.path}: ${w.message}`).join('\n  '));
    })
    .transform((data) => data as ArticleData),
});

export const collections = { blog, articles };
