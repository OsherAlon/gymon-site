/** Types for the article JSON. The rules live in schema.mjs / validate.mjs; these only describe the shape. */

export type Lang = 'en' | 'he';
export type Evidence = 'strong' | 'moderate' | 'limited' | 'mixed' | 'insufficient';
export type Tier = 'PRIMARY' | 'AUTHORITY' | 'SECONDARY';

export interface Reference {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  venue?: string;
  url: string;
  doi?: string;
  pmid?: string;
  tier: Tier;
  type: string;
  fullTextRead: boolean;
  quote: string;
  /** What the source found, in plain words, with size and population. Shown only in the sources list. */
  finding: string;
  /** How sure the evidence is. Shown only in the sources list, never as a badge in the body. */
  certainty: Evidence;
}

export interface LoggedSet {
  kg: number;
  reps: number;
  previous: { kg: number; reps: number } | null;
}

export type GymonBlock =
  | { kind: 'log-example'; caption: string; exercise: string; sessions: { label: string; sets: LoggedSet[] }[]; text?: string }
  | { kind: 'plan-logic' | 'teardown-finding'; heading?: string; text: string; points?: string[] };

/** One idea per screen: a plain headline that IS the point, then 1–3 short sentences. */
export interface Beat {
  heading: string;
  text: string;
}

export interface ArticleData {
  schemaVersion: 3;
  lang: Lang;
  slug: string;
  title: string;
  heroTitle: string;
  description: string;
  pillar: string;
  tags: string[];
  primaryQuery: string;
  intent: 'know' | 'do';
  ymylLevel: 'low';
  lengthBand: string;
  image: string;
  imageAlt: string;
  imageAiGenerated: boolean;
  createdAt: string;
  updatedAt?: string | null;
  reviewedAt: string | null;
  editor: 'osher-alon';
  aiAssisted: true;
  sample?: boolean;
  /** A relatable question or situation, 1–2 short sentences. */
  hook: string;
  /** ONE sentence: the takeaway, visible on the first screen. */
  bottomLine: string;
  beats: Beat[];
  /** Verbatim from a cited source (translated on the Hebrew page). */
  pullQuote?: { ref: string; text: string; attribution: string; lead?: string };
  tips: { heading: string; items: string[] };
  calculator?: { calculator: 'one-rep-max'; defaults?: { weightKg?: number; reps?: number } };
  gymon?: GymonBlock;
  references: Reference[];
  cta: { slot: 'log-sets' | 'track-progress' | 'plan-builder' };
}
