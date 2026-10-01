// Content collections (Astro 5 content layer).
//
// «Hender fra Nord» / Hands of the North — the editorial video magazine.
// Content lives as YAML in src/content/hender-fra-nord/ so it is typed,
// versioned and prerendered. The Sanity schemas in schemaTypes/magazineIssue.ts
// and schemaTypes/makerChapter.ts mirror these fields so Studio can take over
// later without changing the pages.
//
// The older markdown under /content (repo root) is not an Astro collection and
// is untouched by this file.
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** A string in both site languages. */
const localized = z.object({ no: z.string(), en: z.string() });

/** Short looping clip: cover and chapter heroes. Muted, no captions. */
const loop = z.object({
  /** 16:9 source (MP4 now; an .m3u8 URL works when type is "hls"). */
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
  captions_no: z.string().optional(),
  captions_en: z.string().optional(),
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

const makerChapters = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/hender-fra-nord/chapters' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    order: z.number(),
    /** Master switch. false keeps the chapter out of every page. */
    published: z.boolean().default(true),
    /** Copy not yet approved. Shows a quiet «Utkast / Draft» tag. */
    draft: z.boolean().default(false),
    /** published: own page · coming: «Filming October» card · hidden: off. */
    status: z.enum(['published', 'coming', 'hidden']).default('published'),
    maker_name: z.string(),
    maker_person: z.string().optional(),
    website: z.string().url().optional(),
    location: localized,
    craft: localized,
    title: localized,
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
    shoot_date: z.coerce.date().optional(),
    /** Image for «coming» cards when there is no hero yet. */
    teaser_image: z.string().optional(),
    credits: z.array(z.object({ role: localized, name: z.string() })).default([]),
  }),
});

const magazineIssues = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/hender-fra-nord/issues' }),
  schema: z.object({
    number: z.number().int().positive(),
    title: localized,
    season: localized,
    published_at: z.coerce.date(),
    draft: z.boolean().default(false),
    manifest: localized,
    cover_loop: loop,
    og_image: z.string().optional(),
    editor_letter: z.object({
      title: localized,
      body: localized,
      signature: z.string(),
      role: localized,
      draft: z.boolean().default(false),
    }),
    chapters: z.array(reference('makerChapters')),
    colophon: z.object({
      entries: z.array(z.object({ role: localized, names: z.array(z.string()) })),
      note: localized.optional(),
    }),
  }),
});

export const collections = { makerChapters, magazineIssues };
