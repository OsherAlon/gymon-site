import * as React from "react";

/**
 * The phone chassis from the user-supplied PhoneScrollHero, extracted unchanged so the home
 * showcase rows use the same frame (2026-10-07).
 */
export function PhoneFrame({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[13rem] sm:w-[15rem] md:w-[17rem]">
      <span aria-hidden className="absolute -left-[2px] top-[16%] h-7 w-[3px] rounded-l-sm bg-muted-foreground/30" />
      <span aria-hidden className="absolute -left-[2px] top-[24%] h-11 w-[3px] rounded-l-sm bg-muted-foreground/30" />
      <span aria-hidden className="absolute -right-[2px] top-[22%] h-14 w-[3px] rounded-r-sm bg-muted-foreground/30" />
      <div className="aspect-[9/19.5] rounded-[2.5rem] border border-border bg-muted p-[0.35rem] shadow-[0_10px_20px_rgba(0,0,0,0.18),0_40px_60px_-20px_rgba(0,0,0,0.35)]">
        <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-background ring-1 ring-inset ring-border/70">
          <div aria-hidden className="absolute left-1/2 top-2 z-10 h-[1.1rem] w-[4.25rem] -translate-x-1/2 rounded-full bg-black" />
          {children ?? (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground/70">Replace screen</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
