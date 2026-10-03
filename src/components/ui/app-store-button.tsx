/**
 * The App Store download badge.
 *
 * Renders Apple's OFFICIAL "Download on the App Store" badge artwork, unmodified
 * (App Store Marketing Guidelines allow only the official badges — no recreated
 * buttons). Files in public/badges/, downloaded from Apple's marketing toolbox:
 *   https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/en-us
 *   https://toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/black/he-il
 *
 * Minimum on-screen height is 40px; keep clear space of at least a quarter of the
 * badge height around it (handled by the header's gaps).
 *
 * `href` null → the app is not live yet: the badge is shown but leads nowhere
 * (no href, aria-disabled, default cursor, no hover state).
 *
 * Rendered on the server only (no hydration, no JS).
 */

export type BadgeLang = 'en' | 'he';

const BADGES: Record<BadgeLang, { src: string; alt: string; width: number; height: number }> = {
  // Intrinsic sizes from each SVG's viewBox.
  en: { src: '/badges/app-store-en-us.svg', alt: 'Download on the App Store', width: 119.664, height: 40 },
  he: { src: '/badges/app-store-he-il.svg', alt: 'להורדה ב-App Store', width: 121.664, height: 42 },
};

export interface AppStoreButtonProps {
  lang: BadgeLang;
  /** The App Store listing. null while the app is not live. */
  href: string | null;
  /** Rendered height in px (Apple's minimum on screen: 40). */
  height?: number;
  className?: string;
}

export function AppStoreButton({ lang, href, height = 40, className }: AppStoreButtonProps) {
  const badge = BADGES[lang];
  const img = (
    <img
      src={badge.src}
      alt={badge.alt}
      width={Math.round((badge.width / badge.height) * height)}
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
  const cls = ['app-store-badge', className].filter(Boolean).join(' ');
  return href ? (
    <a className={cls} href={href} rel="noopener">
      {img}
    </a>
  ) : (
    <a className={cls} aria-disabled="true">
      {img}
    </a>
  );
}

export default AppStoreButton;
