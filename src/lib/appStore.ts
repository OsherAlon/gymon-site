import { APP_STORE_URL, APP_STORE_PROVIDER_TOKEN } from '../copy.mjs';

const url = APP_STORE_URL as string | null;
const pt = APP_STORE_PROVIDER_TOKEN as string | null;

/** The numeric App Store id, for the Smart App Banner. null while the app is not live. */
export const appStoreId: string | null = url ? (url.match(/id(\d+)/)?.[1] ?? null) : null;

/** The listing with a campaign token per placement (`blog-inline`, `blog-end`). null while not live. */
export function campaignUrl(ct: 'blog-inline' | 'blog-end'): string | null {
  if (!url) return null;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${pt ? `pt=${encodeURIComponent(pt)}&` : ''}ct=${ct}&mt=8`;
}
