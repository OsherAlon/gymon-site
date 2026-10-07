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
}

export interface LoggedSet {
  kg: number;
  reps: number;
  previous: { kg: number; reps: number } | null;
}

export type Block =
  | { type: 'p'; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'takeaway'; text: string }
  | { type: 'claim'; evidence: Evidence; refs?: string[]; text: string }
  | { type: 'callout'; kind: 'note' | 'myth' | 'safety'; text: string }
  | { type: 'table'; caption: string; columns: string[]; rows: string[][]; refs?: string[] }
  | { type: 'calculator'; calculator: 'one-rep-max'; defaults?: { weightKg?: number; reps?: number } }
  | { type: 'cta' }
  | { type: 'gymon'; kind: 'log-example'; caption: string; exercise: string; sessions: { label: string; sets: LoggedSet[] }[]; text?: string }
  | { type: 'gymon'; kind: 'plan-logic' | 'teardown-finding'; heading?: string; text: string; points?: string[] };

export interface Section {
  heading: string;
  apply?: boolean;
  blocks: Block[];
}

export interface ArticleData {
  schemaVersion: 1;
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
  tldr: string;
  keyTakeaways: { text: string; refs?: string[] }[];
  sections: Section[];
  faq?: { q: string; a: string; refs?: string[] }[];
  quiz?: { question: string; options: string[]; correctIndex: number; explanation: string; refs?: string[] }[];
  references: Reference[];
  cta: { slot: 'log-sets' | 'track-progress' | 'plan-builder' };
}
