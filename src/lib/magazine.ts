// Shared helpers for «Hender fra Nord» / Hands of the North.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Lang = 'no' | 'en';
export type Localized = { no: string; en: string };
export type Chapter = CollectionEntry<'makerChapters'>['data'];
export type Issue = CollectionEntry<'magazineIssues'>['data'];

export const SITE = 'https://scandijapandi.no';
export const ISSUE_ID = 'issue-01';

/** Static route per language. NO lives at the root, EN under /en. */
export const BASE: Record<Lang, string> = {
  no: '/hender-fra-nord',
  en: '/en/hands-of-the-north',
};

export const issueUrl = (lang: Lang) => BASE[lang];
export const chapterUrl = (lang: Lang, slug: string) => `${BASE[lang]}/${slug}`;
export const abs = (path: string) => (path.startsWith('http') ? path : `${SITE}${path}`);

export const t = (value: Localized | undefined, lang: Lang) => (value ? value[lang] : '');

/** Split running text on blank lines. */
export const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export const pad = (n: number) => String(n).padStart(2, '0');

/** 8 → "0:08", 372 → "6:12". */
export const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** 8 → "PT8S", 372 → "PT6M12S" (schema.org). */
export const isoDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `PT${m ? `${m}M` : ''}${s || !m ? `${s}S` : ''}`;
};

/** Hide empty placeholders such as "—" from metadata lines. */
export const known = (value: string) => Boolean(value) && value.trim() !== '—';

/** "[utkast] Tekst" → { draft: true, text: "Tekst" } so the tag can be styled. */
export const splitDraft = (text: string) => {
  const m = text.match(/^\s*\[(utkast|draft)\]\s*/i);
  return m ? { draft: true, text: text.slice(m[0].length) } : { draft: false, text };
};

/** The issue plus its chapters, split by status and in reading order. */
export async function loadIssue() {
  const entry = await getEntry('magazineIssues', ISSUE_ID);
  if (!entry) throw new Error(`Missing magazine issue ${ISSUE_ID}`);
  const ids = new Set(entry.data.chapters.map((c) => c.id));
  const all = (await getCollection('makerChapters'))
    .map((c) => c.data)
    .filter((c) => ids.has(c.slug) && c.published)
    .sort((a, b) => a.order - b.order);
  return {
    issue: entry.data,
    chapters: all.filter((c) => c.status === 'published'),
    coming: all.filter((c) => c.status === 'coming'),
  };
}

const MONTHS: Record<Lang, string[]> = {
  no: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
export const monthYear = (d: Date, lang: Lang) => `${MONTHS[lang][d.getUTCMonth()]} ${d.getUTCFullYear()}`;

/** Interface copy. Editorial copy lives in src/content/hender-fra-nord. */
export const UI = {
  no: {
    htmlLang: 'nb',
    ogLocale: 'nb_NO',
    otherLangLabel: 'English',
    otherLangShort: 'EN',
    langName: 'Norsk',
    shop: 'Butikk',
    issue: 'Nummer',
    issueShort: 'Issue',
    magazineBy: 'Et videomagasin fra Scandi Japandi Collection',
    presentedBy: 'Presentert av Scandi Japandi Collection',
    editorLetter: 'Leder',
    contents: 'Innhold',
    chaptersInIssue: 'Kapitler i dette nummeret',
    chapter: 'Kapittel',
    readChapter: 'Les kapittelet',
    film: 'Film',
    watchFilm: 'Se filmen',
    playFilm: 'Spill av filmen',
    withCaptions: 'Norsk og engelsk teksting',
    conversation: 'Samtalen',
    gallery: 'Bildeessay',
    fromWorkshop: 'Fra verkstedet',
    objectsFrom: 'Objekter fra',
    objectsComing: 'Objektene kommer til butikken',
    objectsComingBody: 'Vi jobber med å ta inn et utvalg. Til da kan du lese om hvordan vi arbeider med håndverkere.',
    forMakers: 'For håndverkere',
    seeObject: 'Se objektet',
    next: 'Neste kapittel',
    backToIssue: 'Tilbake til innholdet',
    coming: 'Kommer',
    comingTitle: 'Senere i dette nummeret',
    comingBody: 'To kapitler til filmes i oktober og legges inn i nummeret etter opptak.',
    chapterCount: (n: number) => `${n} kapitler`,
    filming: 'Filmes',
    colophon: 'Kolofon',
    newMakers: 'Er du håndverker? Vi leser alle henvendelser.',
    newMakersLink: 'Les om å bli med',
    draft: 'Utkast',
    placeholderMedia: 'Plassholdermedier',
    pauseMotion: 'Pause bevegelse',
    playMotion: 'Spill bevegelse',
    scroll: 'Bla videre',
    langHint: 'This issue is also available in English',
    skip: 'Hopp til innholdet',
    maker: 'Maker',
    place: 'Sted',
    craft: 'Håndverk',
    website: 'Nettsted',
    credits: 'Kreditter',
    rights: 'Alle rettigheter reservert',
  },
  en: {
    htmlLang: 'en',
    ogLocale: 'en_GB',
    otherLangLabel: 'Norsk',
    otherLangShort: 'NO',
    langName: 'English',
    shop: 'Shop',
    issue: 'Issue',
    issueShort: 'Issue',
    magazineBy: 'A video magazine by Scandi Japandi Collection',
    presentedBy: 'Presented by Scandi Japandi Collection',
    editorLetter: 'From the editor',
    contents: 'Contents',
    chaptersInIssue: 'Chapters in this issue',
    chapter: 'Chapter',
    readChapter: 'Read the chapter',
    film: 'Film',
    watchFilm: 'Watch the film',
    playFilm: 'Play the film',
    withCaptions: 'English and Norwegian captions',
    conversation: 'The conversation',
    gallery: 'Photo essay',
    fromWorkshop: 'From the workshop',
    objectsFrom: 'Objects from',
    objectsComing: 'Objects coming to the shop',
    objectsComingBody: 'We are preparing a small selection. Until then, read about how we work with makers.',
    forMakers: 'For makers',
    seeObject: 'View object',
    next: 'Next chapter',
    backToIssue: 'Back to contents',
    coming: 'Coming',
    comingTitle: 'Later in this issue',
    comingBody: 'Two more chapters are filmed in October and join the issue after the shoot.',
    chapterCount: (n: number) => `${n} chapters`,
    filming: 'Filming',
    colophon: 'Colophon',
    newMakers: 'Are you a maker? We read every letter.',
    newMakersLink: 'How to take part',
    draft: 'Draft',
    placeholderMedia: 'Placeholder media',
    pauseMotion: 'Pause motion',
    playMotion: 'Play motion',
    scroll: 'Continue',
    langHint: 'Dette nummeret finnes også på norsk',
    skip: 'Skip to content',
    maker: 'Maker',
    place: 'Place',
    craft: 'Craft',
    website: 'Website',
    credits: 'Credits',
    rights: 'All rights reserved',
  },
} as const;

export type UIStrings = (typeof UI)[Lang];
