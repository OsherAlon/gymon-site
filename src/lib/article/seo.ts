/**
 * Structured data and dates for a doctrine article (SEO doctrine §5 "Structured data",
 * UX doctrine §6). BlogPosting + BreadcrumbList only — no FAQPage/HowTo (retired rich
 * results), no MedicalWebPage (overclaims for a non-authority). Everything here must match
 * what the page shows.
 */
import type { ArticleData } from './types';
import { DOMAIN } from '../source';

/** "2026-10-07" → "2026-10-07T00:00:00+03:00" (Asia/Jerusalem offset of that day). */
export function isoJerusalem(date: string): string {
  const noon = new Date(`${date}T12:00:00Z`);
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', timeZoneName: 'longOffset' })
    .formatToParts(noon)
    .find((p) => p.type === 'timeZoneName')?.value;
  const off = tz && tz !== 'GMT' ? tz.replace('GMT', '') : '+00:00';
  return `${date}T00:00:00${off}`;
}

export const absolute = (path: string) => (path.startsWith('http') ? path : `https://${DOMAIN}${path}`);

export function articleJsonLd(a: ArticleData, opts: { url: string; blogUrl: string; blogName: string; editorName: string }) {
  const posting: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.description,
    image: [absolute(a.image)],
    datePublished: isoJerusalem(a.createdAt),
    dateModified: isoJerusalem(a.updatedAt ?? a.createdAt),
    inLanguage: a.lang,
    mainEntityOfPage: opts.url,
    isAccessibleForFree: true,
    author: { '@type': 'Person', name: opts.editorName },
    publisher: { '@type': 'Organization', name: 'Gymon', url: `https://${DOMAIN}/` },
    citation: a.references.map((r) => ({
      '@type': 'CreativeWork',
      name: r.title,
      url: r.url,
      ...(r.year ? { datePublished: String(r.year) } : {}),
      ...(r.authors.length ? { author: r.authors.map((n) => ({ '@type': 'Person', name: n })) } : {}),
    })),
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: opts.blogName, item: opts.blogUrl },
      { '@type': 'ListItem', position: 2, name: a.title, item: opts.url },
    ],
  };
  // `<` escaped so a title can never close the script element.
  return [posting, crumbs].map((o) => JSON.stringify(o).replace(/</g, '\\u003c'));
}
