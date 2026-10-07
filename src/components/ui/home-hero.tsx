import { PhoneScrollHero } from '@/components/ui/phone-scroll-hero';

/**
 * Home hero: the site's existing headline and tagline as the title, and one app screen inside
 * the phone of the user-supplied PhoneScrollHero (src/components/ui/phone-scroll-hero.tsx, kept
 * verbatim). Server-rendered by Astro, so the H1 and the image are in the HTML before hydration.
 */
interface Props {
  title: string;
  tagline: string;
  screenSrc: string;
  screenAlt: string;
}

export default function HomeHero({ title, tagline, screenSrc, screenAlt }: Props) {
  return (
    <PhoneScrollHero
      titleComponent={
        <div className="pb-10">
          <h1 className="text-foreground text-5xl leading-tight font-bold text-balance sm:text-6xl">{title}</h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md text-lg leading-relaxed text-balance">{tagline}</p>
        </div>
      }
    >
      <img src={screenSrc} alt={screenAlt} width={840} height={1720} className="h-full w-full object-cover object-top" decoding="async" />
    </PhoneScrollHero>
  );
}
