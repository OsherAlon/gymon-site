import { getCollection, type CollectionEntry } from 'astro:content';

import { copy } from '../copy.mjs';
import type { Lang } from './source';

export type Article = CollectionEntry<'blog'>;

/**
 * The article hero's background — ONE fixed, site-wide image behind every
 * article (the article's own `image` is the one that expands over it).
 * To swap it: replace public/blog/hero-bg.svg, or drop the new file in
 * public/blog/ and point this constant at it.
 */
export const BLOG_HERO_BG = '/blog/hero-bg.svg';

/** Published articles in one language, newest first. Drafts never build. */
export async function articles(lang: Lang): Promise<Article[]> {
  const all = await getCollection('blog', ({ data }) => data.lang === lang && !data.draft);
  return all.sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());
}

/** Languages an article (by slug) is published in. */
export async function languagesOf(slug: string): Promise<Lang[]> {
  const all = await getCollection('blog', ({ data }) => data.slug === slug && !data.draft);
  return (['en', 'he'] as const).filter((l) => all.some((a) => a.data.lang === l));
}

export const blogCopy = (lang: Lang) => (copy as any)[lang].blog as {
  title: string;
  heading: string;
  subheading: string;
  by: string;
  readTime: (n: number) => string;
  dateLocale: string;
  back: string;
  scrollToRead: string;
  disclaimer: string;
  empty: string;
};

export const formatDate = (lang: Lang, d: Date) =>
  new Intl.DateTimeFormat(blogCopy(lang).dateLocale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d);

export const articleUrl = (lang: Lang, slug: string) => `${lang === 'en' ? '' : '/he'}/blog/${slug}`;
