import { getCollection, type CollectionEntry } from 'astro:content';

import { copy } from '../copy.mjs';
import type { Lang } from './source';
import { readTimeOf } from './article/validate.mjs';

export type Article = CollectionEntry<'blog'>;

/**
 * The article hero's background — ONE fixed, site-wide image behind every
 * article (the article's own `image` is the one that expands over it).
 * To swap it: replace public/blog/hero-bg.jpg, or drop the new file in
 * public/blog/ and point this constant at it.
 */
export const BLOG_HERO_BG = '/blog/hero-bg.jpg';

/** Published articles in one language, newest first. Drafts never build. */
export async function articles(lang: Lang): Promise<Article[]> {
  const all = await getCollection('blog', ({ data }) => data.lang === lang && !data.draft);
  return all.sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());
}

export type DocArticle = CollectionEntry<'articles'>;

/** Doctrine (JSON) articles in one language, newest first. */
export async function docArticles(lang: Lang): Promise<DocArticle[]> {
  const all = await getCollection('articles', ({ data }) => data.lang === lang);
  return all.sort((a, b) => b.data.createdAt.localeCompare(a.data.createdAt));
}

/** One card on the blog index — the same shape for both content kinds. */
export interface Listing {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: Date;
  author: string;
  readTime: number;
  /** Mock, preview or sample: keeps the index noindex while nothing real is listed. */
  placeholder: boolean;
}

/** Everything the index lists in one language, newest first. A JSON article wins over a Markdown one with the same slug. */
export async function listing(lang: Lang): Promise<Listing[]> {
  const docs = await docArticles(lang);
  const out: Listing[] = docs.map(({ data }) => ({
    slug: data.slug,
    title: data.title,
    description: data.description,
    image: data.image,
    date: new Date(`${data.createdAt}T00:00:00Z`),
    author: (copy as any)[lang].blog.article.editor.name,
    readTime: readTimeOf(data),
    placeholder: !!data.sample,
  }));
  for (const { data } of await articles(lang)) {
    if (out.some((o) => o.slug === data.slug)) continue;
    out.push({ slug: data.slug, title: data.title, description: data.description, image: data.image, date: data.createdAt, author: data.author, readTime: data.readTime, placeholder: data.mock });
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Languages an article (by slug) is published in. */
export async function languagesOf(slug: string): Promise<Lang[]> {
  const md = await getCollection('blog', ({ data }) => data.slug === slug && !data.draft);
  const docs = await getCollection('articles', ({ data }) => data.slug === slug);
  return (['en', 'he'] as const).filter((l) => md.some((a) => a.data.lang === l) || docs.some((a) => a.data.lang === l));
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
