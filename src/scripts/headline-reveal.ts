/**
 * Headline reveal for articles — the user-supplied TextBlockAnimation (2026-10-07), as a plain
 * module (no React island on article pages). A cyan bar scales in over each line, the line
 * appears halfway, the bar scales out.
 *
 * Applies ONLY to [data-reveal] elements: the article H1, the "In short" line and the section
 * headings. Server HTML stays visible: nothing is hidden until this script runs, and only right
 * before a heading animates. Headings already in view play at once; the rest play once when they
 * reach 85% of the viewport and are never re-hidden on scroll up. Reduced motion: plain text.
 * RTL: the bar grows from the right and exits to the left. SplitText waits for the fonts and
 * re-splits on resize (autoSplit); a heading that already played is not animated again.
 *
 * Lines: SplitText's own `lines` detection assumes a new line starts further LEFT (it never
 * splits Hebrew — measured: every Hebrew heading came back as one "line"). So SplitText splits
 * WORDS, and the words are grouped into lines here by their vertical position, which works in
 * both directions. Each line group is wrapped in a block mask that holds the bar.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const BAR = '#3fc6dc'; // --color-highlight
const DURATION = 0.6;
const STAGGER = 0.1;

/** Top-level child nodes of `el` grouped into visual lines by their vertical centre. */
function groupLines(el: HTMLElement): Node[][] {
  const lh = parseFloat(getComputedStyle(el).lineHeight) || 30;
  const groups: Node[][] = [];
  let lastY = -Infinity;
  for (const n of [...el.childNodes]) {
    if (n.nodeType === 1) {
      const r = (n as Element).getBoundingClientRect();
      const y = r.top + r.height / 2;
      if (r.height && y > lastY + lh * 0.5) {
        groups.push([]);
        lastY = y;
      }
    }
    if (!groups.length) groups.push([]);
    groups[groups.length - 1].push(n);
  }
  return groups.filter((g) => g.length);
}

async function run() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  await document.fonts.ready;
  const rtl = document.documentElement.dir === 'rtl';
  const from = rtl ? 'right center' : 'left center';
  const to = rtl ? 'left center' : 'right center';

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    let played = false;
    SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit() {
        if (played) return; // re-split after resize: the text is already shown
        const groups = groupLines(el);
        const lines: HTMLElement[] = [];
        const blocks = groups.map((nodes) => {
          const mask = document.createElement('span');
          Object.assign(mask.style, { display: 'block', position: 'relative', overflow: 'clip' });
          const line = document.createElement('span');
          line.style.display = 'block';
          nodes[0].parentNode!.insertBefore(mask, nodes[0]);
          nodes.forEach((n) => line.appendChild(n));
          mask.appendChild(line);
          lines.push(line);
          const b = document.createElement('span');
          b.setAttribute('aria-hidden', 'true');
          Object.assign(b.style, { position: 'absolute', inset: '0', background: BAR, zIndex: '2', transform: 'scaleX(0)', transformOrigin: from });
          mask.appendChild(b);
          return b;
        });
        gsap.set(lines, { opacity: 0 });
        const inView = el.getBoundingClientRect().top < window.innerHeight * 0.85;
        const tl = gsap.timeline({
          defaults: { ease: 'expo.inOut' },
          onComplete: () => {
            played = true;
            blocks.forEach((b) => b.remove());
          },
          ...(inView ? {} : { scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' } }),
        });
        tl.to(blocks, { scaleX: 1, transformOrigin: from, duration: DURATION, stagger: STAGGER })
          .set(lines, { opacity: 1 }, `<${DURATION / 2}`)
          .to(blocks, { scaleX: 0, transformOrigin: to, duration: DURATION, stagger: STAGGER }, `<${DURATION * 0.4}`);
        return tl;
      },
    });
  });
}

run();
