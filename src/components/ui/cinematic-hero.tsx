import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';
import { AppStoreButton } from '@/components/ui/app-store-button';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * CinematicHero — the user-supplied component (2026-10-07), adapted for Gymon:
 *  - the iPhone shows the real home screen (public/app/screen-home-{lang}.webp); the fake widgets,
 *    progress ring and counter are gone (no invented metric);
 *  - the two glass badges are moments the logger screenshot really shows (rest 1:30, a 40 kg × 6
 *    set), no streaks or claims;
 *  - Gymon dark card (#0B1115 → near-black) with the cyan accent; the page around it stays white;
 *  - CTA: the official App Store badge (disabled "coming soon" while APP_STORE_URL is null) and a
 *    Google Play "coming soon" text pill — not Google's badge;
 *  - one H1 (tagline1 + tagline2 as spans), server-rendered and visible without JS: the
 *    .gsap-reveal hiding only applies while the timeline is armed, and a <noscript> style and a
 *    reduced-motion media query render the final composed state statically (no pin, no scrub);
 *  - pinned scroll cut from +=7000 to +=2400 (desktop) / +=1600 (below 768px);
 *  - RTL mirrors the x offsets, the badge sides (logical start/end) and the mockup's entry
 *    rotationY; mouse tilt only on pointer:fine; w-full instead of w-screen.
 */
export interface CinematicHeroProps {
  lang: 'en' | 'he';
  brandName: string;
  tagline1: string;
  tagline2: string;
  cardHeading: string;
  cardDescription: string;
  screenSrc: string;
  screenAlt: string;
  badges: { icon: string; title: string; subtitle: string }[];
  ctaHeading: string;
  ctaDescription: string;
  ctaLink?: { href: string; label: string };
  appStoreHref: string | null;
  playSoon: { name: string; soon: string };
  className?: string;
}

const STYLES = `
  .cine .gsap-reveal { visibility: hidden; }
  .cine .film-grain { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 50; opacity: 0.05; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>'); }
  .cine .bg-grid-theme { background-size: 60px 60px;
      background-image: linear-gradient(to right, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%); -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%); }
  .cine .text-3d-matte { color: var(--color-foreground); text-shadow: 0 10px 30px color-mix(in srgb, var(--color-foreground) 20%, transparent), 0 2px 4px color-mix(in srgb, var(--color-foreground) 10%, transparent); }
  .cine .text-silver-matte { background: linear-gradient(180deg, var(--color-foreground) 0%, color-mix(in srgb, var(--color-foreground) 55%, transparent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; transform: translateZ(0);
      filter: drop-shadow(0px 10px 20px color-mix(in srgb, var(--color-foreground) 15%, transparent)) drop-shadow(0px 2px 4px color-mix(in srgb, var(--color-foreground) 10%, transparent)); }
  .cine .text-card-silver-matte { background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; transform: translateZ(0);
      filter: drop-shadow(0px 12px 24px rgba(0,0,0,0.8)) drop-shadow(0px 4px 8px rgba(0,0,0,0.6)); }
  .cine .premium-depth-card { background: linear-gradient(145deg, #16252c 0%, #0B1115 55%, #05080a 100%);
      box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.6), 0 20px 40px -20px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.04); position: relative; }
  .cine .card-sheen { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(63,198,220,0.08) 0%, transparent 40%); mix-blend-mode: screen; transition: opacity 0.3s ease; }
  .cine .iphone-bezel { background-color: #111; box-shadow: inset 0 0 0 2px #52525B, inset 0 0 0 7px #000, 0 40px 80px -15px rgba(0,0,0,0.9), 0 15px 25px -5px rgba(0,0,0,0.7); transform-style: preserve-3d; }
  .cine .hardware-btn { background: linear-gradient(90deg, #404040 0%, #171717 100%); box-shadow: -2px 0 5px rgba(0,0,0,0.8), inset -1px 0 1px rgba(255,255,255,0.15), inset 1px 0 2px rgba(0,0,0,0.8); border-left: 1px solid rgba(255,255,255,0.05); }
  .cine .screen-glare { background: linear-gradient(110deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%); }
  .cine .floating-ui-badge { background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.5); }
  .cine .main-card { transform: translateY(calc(100svh + 200px)); }
`;

/* Final composed state, no pin, no scrub: used for prefers-reduced-motion and (inside <noscript>)
   when JS never runs. Everything stacks in normal flow and is visible. */
const STATIC = `
  .cine { height: auto !important; display: block !important; padding: 32px 16px 48px; overflow: visible !important; }
  .cine .gsap-reveal { visibility: visible !important; opacity: 1 !important; filter: none !important; transform: none !important; clip-path: none !important; }
  .cine .hero-text-wrapper, .cine .cta-wrapper, .cine .cine-fg { position: static !important; inset: auto !important; transform: none !important; }
  .cine .cine-fg { display: block !important; margin-block: 32px; }
  .cine .main-card { transform: none !important; width: 100% !important; height: auto !important; min-height: 0; padding-block: 32px; }
  .cine .cta-wrapper { margin-top: 32px; }
  .cine .film-grain, .cine .bg-grid-theme { display: none; }
`;

export function CinematicHero(p: CinematicHeroProps) {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const mockup = useRef<HTMLDivElement>(null);
  const rtl = p.lang === 'he';

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const isMobile = window.innerWidth < 768;
      const topbarH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 72;
      const dir = rtl ? -1 : 1;

      // Mouse tilt + sheen (pointer:fine only), only near the top of the page.
      let raf = 0;
      const onMove = (e: MouseEvent) => {
        if (window.scrollY > window.innerHeight * 2 || raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          if (card.current) {
            const r = card.current.getBoundingClientRect();
            card.current.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
            card.current.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
          }
          if (mockup.current) gsap.to(mockup.current, { rotationY: xVal * 12, rotationX: -yVal * 12, ease: 'power3.out', duration: 1.2 });
        });
      };
      const fine = window.matchMedia('(pointer: fine)').matches;
      if (fine) window.addEventListener('mousemove', onMove, { passive: true });

      gsap.set('.text-track', { autoAlpha: 0, y: 60, scale: 0.85, filter: 'blur(20px)', rotationX: -20 });
      gsap.set('.text-days', { autoAlpha: 1, clipPath: rtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' });
      gsap.set('.main-card', { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set(['.card-left-text', '.card-right-text', '.mockup-scroll-wrapper', '.floating-badge'], { autoAlpha: 0 });
      gsap.set('.cta-wrapper', { autoAlpha: 0, scale: 0.8, filter: 'blur(30px)' });

      const intro = gsap.timeline({ delay: 0.3 });
      intro
        .to('.text-track', { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', rotationX: 0, ease: 'expo.out' })
        .to('.text-days', { duration: 1.4, clipPath: 'inset(0 0% 0 0)', ease: 'power4.inOut' }, '-=1.0');

      const tl = gsap.timeline({
        // Pinned just below the fixed top bar, so the full-bleed card is never under it.
        scrollTrigger: { trigger: root.current, start: () => `top ${topbarH()}px`, end: isMobile ? '+=1600' : '+=2400', pin: true, scrub: 1, anticipatePin: 1 },
      });
      tl.to(['.hero-text-wrapper', '.bg-grid-theme'], { scale: 1.15, filter: 'blur(20px)', opacity: 0.2, ease: 'power2.inOut', duration: 2 }, 0)
        .to('.main-card', { y: 0, ease: 'power3.inOut', duration: 2 }, 0)
        .to('.main-card', { width: '100%', height: '100%', borderRadius: 0, ease: 'power3.inOut', duration: 1.5 })
        .fromTo(
          '.mockup-scroll-wrapper',
          { y: 300, z: -500, rotationX: 50, rotationY: -30 * dir, autoAlpha: 0, scale: 0.6 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: 'expo.out', duration: 2.5 },
          '-=0.8',
        )
        .fromTo(
          '.floating-badge',
          { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -10 * dir },
          { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: 'back.out(1.5)', duration: 1.5, stagger: 0.2 },
          '-=2.0',
        )
        .fromTo('.card-left-text', { x: -50 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: 'power4.out', duration: 1.5 }, '-=1.5')
        .fromTo('.card-right-text', { x: 50 * dir, autoAlpha: 0, scale: 0.8 }, { x: 0, autoAlpha: 1, scale: 1, ease: 'expo.out', duration: 1.5 }, '<')
        .to({}, { duration: 2.5 })
        .set('.hero-text-wrapper', { autoAlpha: 0 })
        .set('.cta-wrapper', { autoAlpha: 1 })
        .to({}, { duration: 1.5 })
        .to(['.mockup-scroll-wrapper', '.floating-badge', '.card-left-text', '.card-right-text'], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: 'power3.in', duration: 1.2, stagger: 0.05,
        })
        .to(
          '.main-card',
          { width: isMobile ? '92%' : '85%', height: isMobile ? '92%' : '85%', borderRadius: isMobile ? 32 : 40, ease: 'expo.inOut', duration: 1.8 },
          'pullback',
        )
        .to('.cta-wrapper', { scale: 1, filter: 'blur(0px)', ease: 'expo.inOut', duration: 1.8 }, 'pullback')
        .to('.main-card', { y: -window.innerHeight - 300, ease: 'power3.in', duration: 1.5 });

      return () => {
        if (fine) window.removeEventListener('mousemove', onMove);
        if (raf) cancelAnimationFrame(raf);
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-label={p.brandName}
      className={cn('cine relative flex h-[calc(100svh-var(--topbar-h))] w-full items-center justify-center overflow-hidden bg-white', p.className)}
      style={{ perspective: '1500px' }}
    >
      <style>{STYLES + `@media (prefers-reduced-motion: reduce) {${STATIC}}`}</style>
      <noscript>
        <style>{STATIC}</style>
      </noscript>
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="hero-text-wrapper absolute z-10 flex w-full flex-col items-center px-5 text-center">
        <h1 className="flex flex-col items-center leading-[0.95]">
          <span className="text-track gsap-reveal text-3d-matte text-6xl font-bold tracking-tight md:text-8xl lg:text-[7rem]">{p.tagline1}</span>
          <span className="text-days gsap-reveal text-silver-matte mt-3 text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">{p.tagline2}</span>
        </h1>
      </div>

      <div className="cta-wrapper gsap-reveal absolute z-10 flex w-full flex-col items-center px-5 text-center">
        <h2 className="text-silver-matte text-4xl font-bold tracking-tight md:text-6xl">{p.ctaHeading}</h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg">{p.ctaDescription}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <AppStoreButton lang={p.lang} href={p.appStoreHref} height={48} />
          <span className="play-soon" aria-disabled="true" aria-label={`${p.playSoon.name} · ${p.playSoon.soon}`}>
            <span className="play-soon-name" aria-hidden="true">{p.playSoon.name}</span>
            <span className="play-soon-note" aria-hidden="true">{p.playSoon.soon}</span>
          </span>
        </div>
        {p.ctaLink && (
          <a href={p.ctaLink.href} className="text-brand mt-5 text-sm font-semibold underline underline-offset-4">
            {p.ctaLink.label}
          </a>
        )}
      </div>

      <div className="cine-fg pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div
          ref={card}
          className="main-card premium-depth-card pointer-events-auto relative h-[92%] w-[92%] overflow-hidden rounded-[32px] md:h-[85%] md:w-[85%] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />
          <div className="relative z-10 flex h-full flex-col items-center justify-evenly gap-4 px-6 py-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:px-14">
            <div className="card-right-text gsap-reveal order-1 text-center lg:order-3 lg:text-end">
              <p className="text-card-silver-matte text-6xl font-black tracking-tight uppercase md:text-[6rem] lg:text-[7rem]" aria-hidden="true">
                {p.brandName}
              </p>
            </div>

            <div className="mockup-scroll-wrapper gsap-reveal order-2 flex justify-center" style={{ perspective: '1200px' }}>
              <div ref={mockup} className="relative origin-center scale-[0.62] md:scale-[0.85] lg:scale-100" style={{ transformStyle: 'preserve-3d' }}>
                <div className="iphone-bezel relative h-[580px] w-[280px] rounded-[3rem]">
                  <span className="hardware-btn absolute top-[110px] -start-[3px] h-[26px] w-[3px] rounded-s-sm" aria-hidden="true" />
                  <span className="hardware-btn absolute top-[150px] -start-[3px] h-[50px] w-[3px] rounded-s-sm" aria-hidden="true" />
                  <span className="hardware-btn absolute top-[210px] -start-[3px] h-[50px] w-[3px] rounded-s-sm" aria-hidden="true" />
                  <span className="hardware-btn absolute top-[170px] -end-[3px] h-[80px] w-[3px] rounded-e-sm" aria-hidden="true" />
                  <div className="absolute inset-[7px] overflow-hidden rounded-[2.5rem] bg-[#050914]">
                    <img src={p.screenSrc} alt={p.screenAlt} width={660} height={1434} className="h-full w-full object-cover object-top" decoding="async" />
                    <div className="screen-glare pointer-events-none absolute inset-0" aria-hidden="true" />
                    <div className="absolute top-[5px] left-1/2 h-[28px] w-[100px] -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
                  </div>
                </div>
                {p.badges.map((b, i) => (
                  <div
                    key={b.title}
                    className={cn(
                      'floating-badge floating-ui-badge gsap-reveal absolute z-30 flex items-center gap-3 rounded-2xl px-4 py-3 text-start',
                      i === 0 ? 'top-6 -start-[15px] lg:top-12 lg:-start-[80px]' : 'bottom-12 -end-[15px] lg:bottom-20 lg:-end-[80px]',
                    )}
                  >
                    <span className="text-xl" aria-hidden="true">
                      {b.icon}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold whitespace-nowrap text-white">{b.title}</span>
                      <span className="text-xs whitespace-nowrap text-white/60">{b.subtitle}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-left-text gsap-reveal order-3 max-w-md text-center lg:order-1 lg:text-start">
              <h2 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">{p.cardHeading}</h2>
              <p className="mt-3 hidden text-base text-[#9fd8e3]/80 md:block lg:text-lg">{p.cardDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CinematicHero;
