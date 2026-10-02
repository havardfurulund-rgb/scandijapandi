// Content collections (Astro 5 content layer).
//
// 北の手 · Kita no Te — the channel's web magazine (Issue 01: «Hender fra Nord»).
// Content lives as YAML in src/content/kitanote/ so it is typed, versioned and
// prerendered. Japanese is the primary language; every field carries ja, en
// and no. The Sanity schemas in schemaTypes/magazineIssue.ts and
// schemaTypes/makerChapter.ts mirror these fields so Studio can take over
// later without changing the pages.
//
// The older markdown under /content (repo root) is not an Astro collection and
// is untouched by this file.
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** A string in all three languages. Japanese first. */
const localized = z.object({ ja: z.string(), en: z.string(), no: z.string() });

/** A proper name as-is, or a note that needs translating («Plassholder»). */
const nameOrLocalized = z.union([z.string(), localized]);

/** Short looping clip: cover and chapter heroes. Muted, no captions. */
const loop = z.object({
  /** 4:3 source for the image panel (MP4 now; an .m3u8 URL works when type is "hls"). */
  src: z.string(),
  /** Optional 4:5 crop served below 768 px. */
  src_mobile: z.string().optional(),
  type: z.enum(['mp4', 'hls']).default('mp4'),
  poster: z.string(),
  poster_small: z.string().optional(),
  poster_mobile: z.string().optional(),
  /** Describes the poster frame. */
  alt: localized.optional(),
  placeholder: z.boolean().default(false),
});

/** Main chapter film: click-to-play, with sound and captions. */
const film = z.object({
  src: z.string(),
  type: z.enum(['mp4', 'hls']).default('mp4'),
  /** MP4 used when an HLS stream can't be played natively. */
  src_fallback: z.string().optional(),
  poster: z.string(),
  poster_small: z.string().optional(),
  /** Length in seconds. */
  duration: z.number().int().positive(),
  captions_ja: z.string().optional(),
  captions_en: z.string().optional(),
  captions_no: z.string().optional(),
  placeholder: z.boolean().default(false),
});

const galleryImage = z.object({
  src: z.string(),
  src_small: z.string().optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: localized,
  caption: localized.optional(),
  credit: z.string().optional(),
  placeholder: z.boolean().default(false),
});

/** Slugs that would collide with the language folders under /kitanote. */
const RESERVED = ['en', 'no', 'ja', 'jp'];

const makerChapters = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/kitanote/chapters' }),
  schema: z.object({
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .refine((s) => !RESERVED.includes(s), { message: 'Slug collides with a language folder under /kitanote' }),
    order: z.number(),
    /** Master switch. false keeps the chapter out of every page. */
    published: z.boolean().default(true),
    /** Copy not yet approved. Shows a quiet draft tag. */
    draft: z.boolean().default(false),
    /** Japanese reviewed by a native speaker. false: 「翻訳確認中」 tag and noindex. */
    jp_qa: z.boolean().default(false),
    /** published: own page · coming: «Filming October» card · hidden: off. */
    status: z.enum(['published', 'coming', 'hidden']).default('published'),
    maker_name: z.string(),
    /** Maker name in katakana for Japanese running text. */
    maker_name_ja: z.string().optional(),
    maker_person: z.string().optional(),
    website: z.string().url().optional(),
    location: localized,
    craft: localized,
    /** Place + material + person. Japanese is set above and larger. */
    title: localized,
    /** Draft title; the place still needs confirming. */
    title_draft: z.boolean().default(false),
    dek: localized,
    /** Running text. Paragraphs separated by a blank line. */
    body: localized.optional(),
    interview: z.array(z.object({ q: localized, a: localized })).default([]),
    quotes: z
      .array(
        z.object({
          text: localized,
          attribution: z.string().optional(),
          /** Show after this interview answer (0-based). Omit to place after the intro. */
          after: z.number().int().min(-1).optional(),
          draft: z.boolean().default(false),
        }),
      )
      .default([]),
    hero_loop: loop.optional(),
    /** 1200x630 social image. Falls back to the hero poster. */
    og_image: z.string().optional(),
    film: film.optional(),
    gallery: z.array(galleryImage).default([]),
    /** Slugs linked as /products/[slug]. */
    product_slugs: z.array(z.string()).default([]),
    /** Matched (case-insensitive) against `producer` from /api/products on the client. */
    producer_name_match: z.string().optional(),
    /** Published episode page at /stories/[slug] (YouTube + end card). */
    story_slug: z.string().optional(),
    shoot_date: z.coerce.date().optional(),
    /** Image for «coming» cards when there is no hero yet. */
    teaser_image: z.string().optional(),
    credits: z.array(z.object({ role: localized, name: nameOrLocalized })).default([]),
  }),
});

const magazineIssues = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/kitanote/issues' }),
  schema: z.object({
    number: z.number().int().positive(),
    /** The issue's own name: 北欧の作り手 / Hands from the North / Hender fra Nord. */
    title: localized,
    season: localized,
    published_at: z.coerce.date(),
    draft: z.boolean().default(false),
    jp_qa: z.boolean().default(false),
    manifest: localized,
    cover_loop: loop,
    og_image: z.string().optional(),
    /** «Brev fra Norge». Signed by role only; the curator is never shown. */
    letter: z.object({
      title: localized,
      body: localized,
      signature: localized,
      draft: z.boolean().default(false),
    }),
    chapters: z.array(reference('makerChapters')),
    colophon: z.object({
      entries: z.array(z.object({ role: localized, names: z.array(nameOrLocalized) })),
      note: localized.optional(),
    }),
  }),
});

export const collections = { makerChapters, magazineIssues };
