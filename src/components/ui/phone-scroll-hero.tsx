"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { PhoneFrame } from "@/components/ui/phone-frame";

export interface PhoneScrollHeroProps {
  titleComponent: React.ReactNode;
  children?: React.ReactNode;
  overlap?: number;
  tilt?: number;
  className?: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function PhoneScrollHero({ titleComponent, children, overlap = 20, tilt = 22, className }: PhoneScrollHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = React.useRef<HTMLElement>(null);
  const progress = useMotionValue(0);

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const el = sectionRef.current;
    if (!el) return;
    const win = el.ownerDocument.defaultView ?? window;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - win.innerHeight);
      progress.set(Math.min(1, Math.max(0, -rect.top / travel)));
    };
    const onScroll = () => { if (!raf) raf = win.requestAnimationFrame(update); };
    update();
    win.addEventListener("scroll", onScroll, { passive: true });
    win.addEventListener("resize", onScroll);
    return () => {
      win.removeEventListener("scroll", onScroll);
      win.removeEventListener("resize", onScroll);
      if (raf) win.cancelAnimationFrame(raf);
    };
  }, [prefersReducedMotion, progress]);

  const rotateX = useTransform(progress, [0, 1], [tilt, 0]);
  const scale = useTransform(progress, [0, 1], [0.94, 1]);
  const titleY = useTransform(progress, [0, 1], [0, -24]);
  const phoneY = useTransform(progress, [0, 1], ["0%", `-${overlap}%`]);
  const still = Boolean(prefersReducedMotion);

  return (
    <section ref={sectionRef} aria-label="Hero"
      className={cn("relative flex h-[60rem] w-full items-center justify-center overflow-hidden p-2 md:h-[80rem] md:p-8", className)}>
      <div className="w-full" style={{ perspective: "1200px" }}>
        <motion.div style={{ y: still ? 0 : titleY }} className="relative z-0 mx-auto max-w-5xl px-4 text-center">
          {titleComponent}
        </motion.div>
        <motion.div style={{ y: still ? 0 : phoneY, rotateX: still ? 0 : rotateX, scale: still ? 1 : scale }}
          className="relative z-10 -mt-6 md:-mt-12">
          <PhoneFrame>{children}</PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}

export default PhoneScrollHero;
