import * as React from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';
import { PhoneFrame } from '@/components/ui/phone-frame';

/**
 * Home showcase (2026-10-07): 5 rows, a phone on one side and a short explanation on the other,
 * alternating sides. Same chassis and the same tilt-back → flat effect as PhoneScrollHero, but
 * each row's progress is its own: 0 when the row's top enters at the bottom of the viewport,
 * 1 when it reaches 35% from the top — about 0.65 × viewport of scrolling (≈ 550px on a
 * 390×844 phone). One island for all rows: one scroll listener, one rAF.
 *
 * Layout is logical: on ≥768px the phone is the first column (right in RTL, left in LTR) on
 * even rows and the second on odd rows; below 768px every row stacks phone, then text.
 * Reduced motion: flat and static.
 */
export interface ShowcaseRow {
  tag: string;
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

export default function ZigzagShowcase({ rows }: { rows: ShowcaseRow[] }) {
  const still = Boolean(useReducedMotion());
  const refs = React.useRef<(HTMLDivElement | null)[]>([]);
  // Hooks in a fixed-length list: the row count is static per page.
  const progress = rows.map(() => useMotionValue(still ? 1 : 0)); // eslint-disable-line react-hooks/rules-of-hooks

  React.useLayoutEffect(() => {
    if (still) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      refs.current.forEach((el, i) => {
        if (!el) return;
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
    <section className="home-showcase mx-auto w-full max-w-5xl px-5 pb-10 md:py-16">
      {rows.map((row, i) => (
        <div
          key={row.src}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="showcase-row grid items-center gap-6 py-8 md:grid-cols-2 md:gap-16 md:py-16"
        >
          <div className={i % 2 === 1 ? 'md:order-2' : ''}>
            <TiltedPhone progress={progress[i]} still={still} src={row.src} alt={row.alt} />
          </div>
          <div className="text-center md:text-start">
            <p className="text-brand text-sm font-semibold">{row.tag}</p>
            <h2 className="text-foreground mt-2 text-3xl leading-tight font-bold text-balance md:text-4xl">{row.title}</h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-md text-lg leading-relaxed md:mx-0">{row.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
