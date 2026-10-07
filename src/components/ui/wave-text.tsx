import { Fragment, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Wave text — the user-supplied Text_03 (wave-text.tsx), adapted (2026-10-07):
 *  - same behaviour: a motion.span with initial="initial"; every character a motion.span
 *    inline-block with { initial: y 0 scale 1, hover: y −4 scale 1.2, spring 300/15, delay i × 0.03 };
 *  - split by WORDS, then characters: each word is a nowrap inline-block (never broken mid-word)
 *    and the spaces between words are kept, so the server HTML reads as the normal string;
 *  - bidi: an atomic inline (inline-block) counts as a neutral character, so a Latin/digit word in
 *    a Hebrew title ("1RM") would come out reversed — such words get dir="ltr", and a word that
 *    mixes Hebrew and Latin is not split into characters;
 *  - pointer:fine → hover; pointer:coarse (no hover) → plays once when it scrolls into view;
 *    reduced motion → no animation;
 *  - aria-hidden: the heading or link around it carries the full title as its accessible name.
 */
const HEBREW = /[֐-׿]/;
const LATIN_OR_DIGIT = /[A-Za-z0-9]/;

const charVariants = (i: number) => ({
  initial: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.2, transition: { type: 'spring' as const, stiffness: 300, damping: 15, delay: i * 0.03 } },
});

/**
 * `as` renders the heading itself (with aria-label = the title) so that, used as an Astro island,
 * the island's bootstrap <script> lands before the heading and not inside it.
 */
export function WaveText({ text, className, as, headingClassName }: { text: string; className?: string; as?: 'h1' | 'h2'; headingClassName?: string }) {
  const reduce = useReducedMotion();
  const [coarse, setCoarse] = useState(false);
  useEffect(() => setCoarse(window.matchMedia('(pointer: coarse)').matches), []);

  const trigger = reduce ? {} : coarse ? { whileInView: 'hover', viewport: { once: true, amount: 0.6 } } : { whileHover: 'hover' };
  const words = text.split(' ');
  let index = 0;

  const wave = (
    <motion.span className={cn('wave-text', className)} initial="initial" aria-hidden="true" {...trigger}>
      {words.map((word, wi) => {
        const hasHe = HEBREW.test(word);
        const hasLatin = LATIN_OR_DIGIT.test(word);
        const mixed = hasHe && hasLatin;
        return (
          <Fragment key={wi}>
            <span className="inline-block whitespace-nowrap" dir={hasLatin && !hasHe ? 'ltr' : undefined}>
              {mixed
                ? word
                : word.split('').map((ch) => {
                    const i = index++;
                    return (
                      <motion.span key={i} className="inline-block" variants={charVariants(i)}>
                        {ch}
                      </motion.span>
                    );
                  })}
            </span>
            {wi < words.length - 1 && ' '}
          </Fragment>
        );
      })}
    </motion.span>
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
