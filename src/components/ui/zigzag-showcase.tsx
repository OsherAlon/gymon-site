import * as React from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';
import { PhoneFrame } from '@/components/ui/phone-frame';

/**
 * Home showcase (2026-10-07): 6 rows — row 1 is the page's opening (H1 + tagline + home screen), a phone on one side and a short explanation on the other,
 * alternating sides. Same chassis and the same tilt-back → flat effect as PhoneScrollHero, but
 * each row's progress is its own: 0 when the row's top enters at the bottom of the viewport,
 * 1 when it reaches 35% from the top — about 0.65 × viewport of scrolling (≈ 550px on a
 * 390×844 phone). Row 1 is on screen at load, so it starts part-tilted (progress 0.3, ≈ 15°)
 * and flattens over the first half viewport of scrolling. One island: one listener, one rAF.
 *
 * Layout is logical: on ≥768px the phone is the first column (right in RTL, left in LTR) on
 * even rows and the second on odd rows; below 768px every row stacks phone, then text.
 * Reduced motion: flat and static.
 */
export interface ShowcaseRow {
  /** Row 1 carries the page's only H1 ("Gymon") and has no tag. */
  h1?: boolean;
  tag?: string;
  title: string;
  text: string;
  src: string;
  alt: string;
}

function TiltedPhone({ progress, still, src, alt }: { progress: MotionValue<number>; still: boolean; src: string; alt: string }) {
  const rotateX = useTransform(progress, [0, 1], [22, 0]);
  const scale = useTransform(progress, [0, 1], [0.92, 1]);
  return (
    <div style={{ perspective: '1200px' }}>
      <motion.div style={{ rotateX: still ? 0 : rotateX, scale: still ? 1 : scale, transformOrigin: '50% 100%' }}>
        <PhoneFrame>
          <img src={src} alt={alt} width={660} height={1434} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
        </PhoneFrame>
      </motion.div>
    </div>
  );
}

/** Row 1's tilt at scrollY 0: visibly tilted, not fully, so the motion starts on the first scroll. */
const FIRST_START = 0.3;

export default function ZigzagShowcase({ rows }: { rows: ShowcaseRow[] }) {
  const still = Boolean(useReducedMotion());
  const refs = React.useRef<(HTMLDivElement | null)[]>([]);
  // Hooks in a fixed-length list: the row count is static per page.
  const progress = rows.map((_, i) => useMotionValue(still ? 1 : i === 0 ? FIRST_START : 0)); // eslint-disable-line react-hooks/rules-of-hooks

  React.useLayoutEffect(() => {
    if (still) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      refs.current.forEach((el, i) => {
        if (!el) return;
        if (i === 0) {
          progress[0].set(Math.min(1, FIRST_START + (1 - FIRST_START) * (window.scrollY / (vh * 0.5))));
          return;
        }
        const top = el.getBoundingClientRect().top;
        progress[i].set(Math.min(1, Math.max(0, (vh - top) / (vh * 0.65))));
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [still]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="home-showcase mx-auto w-full max-w-[1280px] px-5 pb-10 md:px-12 md:pb-16 lg:px-20">
      {rows.map((row, i) => {
        const phoneSecond = i % 2 === 1;
        return (
          <div
            key={row.src}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`showcase-row grid items-center gap-6 md:grid-cols-2 md:gap-x-24 lg:gap-x-32 ${i === 0 ? 'pt-6 pb-8 md:py-12' : 'py-8 md:py-16'}`}
          >
            {/* Phone hugs its outer edge; the text hugs the opposite edge (logical: start/end). */}
            <div className={`flex justify-center ${phoneSecond ? 'md:order-2 md:justify-end' : 'md:justify-start'}`}>
              <TiltedPhone progress={progress[i]} still={still} src={row.src} alt={row.alt} />
            </div>
            <div className={`w-full text-center md:max-w-[34rem] md:text-start ${phoneSecond ? 'md:justify-self-start' : 'md:justify-self-end'}`}>
              {row.tag && <p className="text-brand text-sm font-semibold">{row.tag}</p>}
              {row.h1 ? (
                <h1 className="text-foreground text-5xl leading-tight font-bold text-balance md:text-6xl">{row.title}</h1>
              ) : (
                <h2 className="text-foreground mt-2 text-3xl leading-tight font-bold text-balance md:text-4xl">{row.title}</h2>
              )}
              <p className={`text-muted-foreground mx-auto max-w-md leading-relaxed md:mx-0 md:max-w-none ${row.h1 ? 'mt-4 text-xl' : 'mt-3 text-lg'}`}>{row.text}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
