import * as React from 'react';

import { cn } from '@/lib/utils';

export interface LazyImageProps {
  src: string;
  /** Shown instead of `src` if it fails to load. */
  fallback?: string;
  /** Load right away. When false, the image is only requested once it scrolls near the viewport. */
  inView?: boolean;
  alt: string;
  /** Width / height, e.g. 16 / 9. */
  ratio?: number;
  /** Applied to the <img>. */
  className?: string;
}

/**
 * An aspect-ratio box with a lazily loaded image that fades in on load and
 * swaps to `fallback` on error.
 *
 * Works without JavaScript too: the server-rendered <img> carries the real
 * `src` and `loading="lazy"`, and the fade-in state is only applied once the
 * component has hydrated (see `mounted`), so a page that never hydrates still
 * shows its images.
 */
export function LazyImage({ src, fallback, inView = false, alt, ratio = 16 / 9, className }: LazyImageProps) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(inView);
  const [loaded, setLoaded] = React.useState(false);
  const [current, setCurrent] = React.useState(src);

  React.useEffect(() => {
    setMounted(true);
    // The image may have finished loading before hydration — onLoad was missed.
    const img = imgRef.current;
    if (img?.complete) {
      if (img.naturalWidth > 0) setLoaded(true);
      else if (fallback && current !== fallback) setCurrent(fallback);
    }
  }, []);

  React.useEffect(() => {
    if (visible) return;
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  // Before hydration, render the real image (SSR / no-JS); after, honour `inView`.
  const showImg = !mounted || visible;

  return (
    <div
      ref={boxRef}
      className="bg-muted relative w-full overflow-hidden rounded-md border"
      style={{ aspectRatio: String(ratio) }}
    >
      {showImg && (
        <img
          ref={imgRef}
          src={current}
          alt={alt}
          loading={inView ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (fallback && current !== fallback) setCurrent(fallback);
            else setLoaded(true);
          }}
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-500',
            mounted && !loaded ? 'opacity-0' : 'opacity-100',
            className,
          )}
        />
      )}
    </div>
  );
}
