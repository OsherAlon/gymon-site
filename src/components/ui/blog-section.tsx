import React from 'react';
import { WaveText } from '@/components/ui/wave-text';
import { LazyImage } from './lazy-image';

export interface BlogCard {
	title: string;
	/** Full link to the article, e.g. `/blog/progressive-overload`. */
	slug: string;
	description: string;
	image: string;
	/** Already formatted for the page's language. */
	createdAt: string;
	author: string;
	/** Already formatted, e.g. "5 min read". */
	readTime: string;
}

export interface BlogSectionProps {
	blogs: BlogCard[];
	heading: string;
	subheading: string;
	/** The word before the author — "by" / "מאת". */
	byLabel?: string;
	/** Shown when an image fails to load. */
	fallbackImage?: string;
}

/**
 * The blog index grid — the 21st.dev component as provided, refactored only to
 * take its data and headings as props. The background glow is positioned by
 * its parent — render it inside a `relative` full-width element (BlogLayout's
 * `<main class="relative">`), which also clips it via `contain-strict`.
 * Hebrew: `rtl:font-sans rtl:tracking-normal` — the mono stack has no Hebrew
 * glyphs, so the fallback monospace font and the tracking pulled the letters apart.
 */
export function BlogSection({
	blogs,
	heading,
	subheading,
	byLabel = 'by',
	fallbackImage = '/blog/fallback.svg',
}: BlogSectionProps) {
	return (
		<div className="mx-auto w-full max-w-5xl grow">
			<div aria-hidden className="absolute inset-0 isolate contain-strict -z-10 opacity-60">
				<div className="-rotate-45 bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 left-0 h-320 w-140 -translate-y-87.5 rounded-full" />
				<div className="-rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 left-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
				<div className="-rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 left-0 h-320 w-60 -translate-y-87.5 rounded-full" />
			</div>
			<div className="space-y-1 px-4 py-8">
				<h1 className="font-mono text-4xl font-bold tracking-wide rtl:font-sans rtl:tracking-normal">{heading}</h1>
				<p className="text-muted-foreground text-base">{subheading}</p>
			</div>
			<div className="absolute inset-x-0 h-px w-full border-b border-dashed" />
			<div className="grid p-4 md:grid-cols-2 lg:grid-cols-3 z-10">
				{blogs.map((blog) => (
					<a href={blog.slug} key={blog.slug} className="group hover:bg-accent/60 active:bg-accent flex flex-col gap-2 rounded-lg p-2 duration-75">
						<LazyImage src={blog.image} fallback={fallbackImage} inView={true} alt={blog.title} ratio={16 / 9} className="transition-all duration-500 group-hover:scale-105" />
						<div className="space-y-2 px-2 pb-2">
							<div className="text-muted-foreground flex items-center gap-2 text-[11px] sm:text-xs">
								<p>{byLabel} {blog.author}</p>
								<div className="bg-muted-foreground size-1 rounded-full" />
								<p>{blog.createdAt}</p>
								<div className="bg-muted-foreground size-1 rounded-full" />
								<p>{blog.readTime}</p>
							</div>
							<h2 className="line-clamp-2 text-lg leading-5 font-semibold tracking-tight" aria-label={blog.title}>
								<WaveText text={blog.title} />
							</h2>
							<p className="text-muted-foreground line-clamp-3 text-sm">{blog.description}</p>
						</div>
					</a>
				))}
			</div>
		</div>
	);
}
