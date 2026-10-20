import { Check, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Single pricing card — adapted from the user-supplied SinglePricingCard (shadcn Badge / Button /
 * Card / Separator, lucide icons) for Gymon (2026-10-07). Data-driven: everything comes from
 * src/copy.mjs `pricing`.
 *
 * Binding adaptations:
 *  - No testimonials carousel (Gymon has no users yet; invented reviews are illegal). `reviews`
 *    stays as an optional prop so a real, permitted block can be added later as data.
 *  - No invented "original price" or "% off": the only saving shown is yearly vs 12 × monthly,
 *    computed the way the app's paywall does (floor) — `save` in copy.
 *  - Both plans are listed as rows (no toggle): the price of each is visible without JS and
 *    without a click, which is the clearest disclosure. Rendered on the server, no hydration.
 *  - The CTA leads to the App Store; while the app is not live (href null) it is a disabled
 *    "coming soon" state, like the header badge. No purchase on the web.
 */
export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  perMonth?: string;
  save?: string;
  featured?: boolean;
}

export interface PricingReview {
  quote: string;
  name: string;
}

export interface SinglePricingCardProps {
  lang: 'en' | 'he';
  badge: string;
  title: string;
  description: string;
  plans: PricingPlan[];
  premiumTitle: string;
  premium: string[];
  freeTitle: string;
  free: string[];
  ctaLabel: string;
  ctaSoon: string;
  href: string | null;
  terms: string[];
  /** Real, permitted reviews only. Empty today, and nothing renders. */
  reviews?: PricingReview[];
}

/** Numbers and currency stay left-to-right inside Hebrew text. */
const Num = ({ children }: { children: string }) => (
  <bdi dir="ltr" className="whitespace-nowrap">
    {children}
  </bdi>
);

export function SinglePricingCard(p: SinglePricingCardProps) {
  return (
    <Card className="pricing-card mx-auto w-full max-w-xl rounded-3xl border-border/80 shadow-[0_20px_50px_-30px_rgba(11,17,21,0.35)]">
      <CardHeader className="items-start gap-3 p-6 sm:p-8">
        <Badge variant="secondary" className="text-brand-strong px-3 py-1 text-sm">
          {p.badge}
        </Badge>
        <CardTitle className="text-3xl">{p.title}</CardTitle>
        <CardDescription className="text-base">{p.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-6 sm:px-8">
        {p.plans.map((plan) => (
          <div
            key={plan.id}
            data-plan={plan.id}
            className={cn(
              'flex items-center justify-between gap-4 rounded-2xl border p-4',
              plan.featured ? 'border-brand bg-[#f2f8fa]' : 'border-border',
            )}
          >
            <div className="flex flex-col items-start gap-1">
              <span className="flex items-center gap-2 font-semibold">
                {plan.name}
                {plan.save && <Badge className="bg-brand text-white">{plan.save}</Badge>}
              </span>
              {plan.perMonth && (
                <span className="text-muted-foreground text-sm">
                  <Num>{plan.perMonth}</Num>
                </span>
              )}
            </div>
            <div className="flex flex-col items-end text-end">
              <span className="price text-2xl font-bold">
                <Num>{plan.price}</Num>
              </span>
              <span className="text-muted-foreground text-sm">{plan.period}</span>
            </div>
          </div>
        ))}
      </CardContent>

      <div className="px-6 py-6 sm:px-8">
        <Separator />
      </div>

      <CardContent className="grid gap-6 px-6 sm:px-8">
        <div>
          <h3 className="text-base font-semibold">{p.premiumTitle}</h3>
          <ul className="mt-3 flex flex-col gap-2.5">
            {p.premium.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <Check aria-hidden className="text-brand mt-1 size-4 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-muted-foreground text-base font-semibold">{p.freeTitle}</h3>
          <ul className="text-muted-foreground mt-3 flex flex-col gap-2.5">
            {p.free.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <Minus aria-hidden className="mt-1 size-4 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-4 p-6 sm:p-8">
        {p.href ? (
          <Button asChild size="lg" className="pricing-cta w-full">
            <a href={p.href} rel="noopener">
              {p.ctaLabel}
            </a>
          </Button>
        ) : (
          <Button asChild size="lg" className="pricing-cta w-full opacity-60">
            <a aria-disabled="true">{p.ctaSoon}</a>
          </Button>
        )}
        <div className="text-muted-foreground flex flex-col gap-2 text-xs leading-relaxed">
          {p.terms.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      </CardFooter>

      {p.reviews && p.reviews.length > 0 && (
        <CardContent className="border-t p-6 sm:p-8">
          {p.reviews.map((r) => (
            <figure key={r.name}>
              <blockquote>{r.quote}</blockquote>
              <figcaption className="text-muted-foreground mt-1 text-sm">{r.name}</figcaption>
            </figure>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export default SinglePricingCard;
