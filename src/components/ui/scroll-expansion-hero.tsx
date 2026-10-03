import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * ScrollExpandMedia (21st.dev) — image mode, ported for Astro.
 *
 * Behaviour, constants and classes are the original's. Adaptations, and why:
 * - `next/image` → `<img loading="eager" decoding="async">` (no Next.js here).
 * - The split title is one `<h1>` holding two `motion.span`s (the original had two
 *   `<h2>`s): the article title must be a single h1 in the server HTML.
 * - Background / overlay use `initial={false}`, so the server HTML is already the
 *   progress-0 frame (the original's `initial={{opacity:0}}` would ship an
 *   invisible background to anyone without JS).
 * - No JS: the content section starts at opacity 0 (as in the original), and the
 *   `<noscript>` style below makes it visible; scrolling is not held without JS.
 * - Keyboard (the original has no keyboard path): PageDown / Space / ArrowDown /
 *   End advance the expansion; ArrowUp / PageUp / Home at the top collapse it.
 *   Focus moving into the content (Tab) expands fully, so it is never hidden.
 * - `prefers-reduced-motion: reduce` → starts fully expanded, no scroll hijack.
 * - `topOffset`: keeps the media box clear of the site's fixed header.
 * - Legibility on bright photos (user decision 2026-10-03): a soft dark text-shadow on the
 *   title and date lines, and a darker media overlay at the start — bg-black/70 ×
 *   (0.85 − p·0.65): ≈60% black at p0 → ≈14% at p1 (original: bg-black/50 × (0.7 − p·0.3),
 *   ≈35% → 20%).
 * - Video mode is not ported (articles only use images).
 */

interface ScrollExpandMediaProps {
  mediaSrc: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  /**
   * Added: height (px) of a fixed site header over the hero. The hero still fills
   * the whole viewport behind it, but the media box is centred in, and capped to,
   * the area below the header so the bar never covers it. 0 = the original.
   */
  topOffset?: number;
  /** Alt text for the media image. */
  alt?: string;
  children?: ReactNode;
}

const ScrollExpandMedia = ({
  mediaSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  topOffset = 0,
  alt,
  children,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  const expandFully = () => {
    setScrollProgress(1);
    setMediaFullyExpanded(true);
    setShowContent(true);
  };

  // Reduced motion: start expanded and never hold the scroll.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      setReducedMotion(mq.matches);
      if (mq.matches) expandFully();
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const advance = (delta: number) => {
      const newProgress = Math.min(Math.max(scrollProgress + delta, 0), 1);
      setScrollProgress(newProgress);
      if (newProgress >= 1) {
        setMediaFullyExpanded(true);
        setShowContent(true);
      } else if (newProgress < 0.75) {
        setShowContent(false);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        advance(e.deltaY * 0.0009);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        // Increase sensitivity for mobile, especially when scrolling back
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        advance(deltaY * scrollFactor);
        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = () => {
      setTouchStartY(0);
    };

    const handleScroll = () => {
      if (!mediaFullyExpanded) {
        window.scrollTo(0, 0);
      }
    };

    // Added: a keyboard path through the expansion.
    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))) return;
      const forward = { ArrowDown: 0.2, PageDown: 0.5, ' ': 0.5, End: 1 } as Record<string, number>;
      const back = { ArrowUp: 0.2, PageUp: 0.5, Home: 1 } as Record<string, number>;
      const key = e.key === ' ' && e.shiftKey ? 'PageUp' : e.key;
      if (!mediaFullyExpanded && key in forward) {
        e.preventDefault();
        advance(forward[key]);
      } else if (key in back && window.scrollY <= 5) {
        e.preventDefault();
        setMediaFullyExpanded(false);
        advance(-back[key]);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY, reducedMotion]);

  // Added: Tab into the (still hidden) content expands it, so focus is never invisible.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onFocus = () => expandFully();
    el.addEventListener('focusin', onFocus);
    return () => el.removeEventListener('focusin', onFocus);
  }, []);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const mediaWidth = 300 + scrollProgress * (isMobileState ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobileState ? 200 : 400);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <div ref={sectionRef} className="transition-colors duration-700 ease-in-out overflow-x-hidden" data-scroll-progress={scrollProgress.toFixed(2)} data-expanded={mediaFullyExpanded ? "" : undefined}>
      <noscript>
        {/* No JS: show the content, and keep the background behind the hero only. */}
        <style>{'[data-sem-content]{opacity:1!important}[data-sem-bg]{height:100dvh!important;overflow:hidden}'}</style>
      </noscript>
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">
          <motion.div
            data-sem-bg=""
            className="absolute inset-0 z-0 h-full"
            initial={false}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <img
              src={bgImageSrc}
              alt=""
              width={1920}
              height={1080}
              loading="eager"
              decoding="async"
              className="w-screen h-screen"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <div className="absolute inset-0 bg-black/10" />
          </motion.div>

          <div className="container mx-auto flex flex-col items-center justify-start relative z-10">
            <div
              className="flex flex-col items-center justify-center w-full h-[100dvh] relative"
              style={topOffset ? { height: `calc(100dvh - ${topOffset}px)`, marginTop: topOffset } : undefined}
            >
              <div
                className="absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: topOffset ? `calc(0.85 * (100dvh - ${topOffset}px))` : '85vh',
                  boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div className="relative w-full h-full">
                  <img
                    src={mediaSrc}
                    alt={alt || title || 'Media content'}
                    width={1280}
                    height={720}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover rounded-xl"
                  />

                  <motion.div
                    className="absolute inset-0 bg-black/70 rounded-xl"
                    initial={false}
                    animate={{ opacity: 0.85 - scrollProgress * 0.65 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                <div className="flex flex-col items-center text-center relative z-10 mt-4 transition-none">
                  {date && (
                    <p className="text-2xl text-blue-200 [text-shadow:0_1px_2px_rgba(0,0,0,.35),0_2px_14px_rgba(0,0,0,.5)]" style={{ transform: `translateX(-${textTranslateX}vw)` }}>
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p className="text-blue-200 font-medium text-center [text-shadow:0_1px_2px_rgba(0,0,0,.35),0_2px_14px_rgba(0,0,0,.5)]" style={{ transform: `translateX(${textTranslateX}vw)` }}>
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              <h1
                className={`flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col ${
                  textBlend ? 'mix-blend-difference' : 'mix-blend-normal'
                }`}
              >
                <motion.span
                  className="block text-4xl md:text-5xl lg:text-6xl font-bold text-blue-200 transition-none [text-shadow:0_1px_2px_rgba(0,0,0,.35),0_2px_14px_rgba(0,0,0,.5)]"
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </motion.span>{' '}
                <motion.span
                  className="block text-4xl md:text-5xl lg:text-6xl font-bold text-center text-blue-200 transition-none [text-shadow:0_1px_2px_rgba(0,0,0,.35),0_2px_14px_rgba(0,0,0,.5)]"
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </motion.span>
              </h1>
            </div>

            <motion.section
              ref={contentRef}
              data-sem-content=""
              className="flex flex-col w-full px-8 py-10 md:px-16 lg:py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
