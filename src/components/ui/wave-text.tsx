import { Fragment, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * Wave text — the user-supplied Text_03, as CSS only (2026-10-07: 109 KB of React + framer-motion
 * for an H1 hover was too heavy). Pure markup, no hooks: rendered on the server with no client
 * directive it ships zero JS (article pages); inside the blog-index island it is the same markup.
 *
 * Animation (global.css "Wave text"): each character lifts y −4px / scale 1.2 with an overshoot
 * easing approximating the source's spring (stiffness 300, damping 15), delayed --i × 30 ms.
 * Hover on (hover:hover) and (pointer:fine); on touch, one hop when the title first scrolls into
 * view (`.wave-play`, added by the tiny inline observer in WaveObserver.astro); nothing with
 * reduced motion.
 *
 * Split by WORDS, then characters: each word is a nowrap inline-block and the spaces stay, so the
 * HTML reads as the normal string. Bidi: an inline-block counts as a neutral character, so a
 * Latin/digit word in a Hebrew title ("1RM") would come out reversed — such words get dir="ltr",
 * and a word mixing Hebrew and Latin is not split. aria-hidden; the heading carries aria-label.
 */
const HEBREW = /[֐-׿]/;
const LATIN_OR_DIGIT = /[A-Za-z0-9]/;

export function WaveText({ text, className, as, headingClassName }: { text: string; className?: string; as?: 'h1' | 'h2'; headingClassName?: string }) {
  const words = text.split(' ');
  let index = 0;
  const wave = (
    <span className={cn('wave-text', className)} aria-hidden="true">
      {words.map((word, wi) => {
        const hasHe = HEBREW.test(word);
        const hasLatin = LATIN_OR_DIGIT.test(word);
        return (
          <Fragment key={wi}>
            <span className="wave-word" dir={hasLatin && !hasHe ? 'ltr' : undefined}>
              {hasHe && hasLatin
                ? word
                : word.split('').map((ch) => {
                    const i = index++;
                    return (
                      <span key={i} className="wave-char" style={{ '--i': i } as CSSProperties}>
                        {ch}
                      </span>
                    );
                  })}
            </span>
            {wi < words.length - 1 && ' '}
          </Fragment>
        );
      })}
    </span>
  );
  if (!as) return wave;
  const Heading = as;
  return (
    <Heading className={headingClassName} aria-label={text}>
      {wave}
    </Heading>
  );
}

export default WaveText;
