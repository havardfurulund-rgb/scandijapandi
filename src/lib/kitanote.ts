// Shared helpers for 北の手 · Kita no Te (Issue 01: «Hender fra Nord»).
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Lang = 'ja' | 'en' | 'no';
export type Localized = Record<Lang, string>;
export type Chapter = CollectionEntry<'makerChapters'>['data'];
export type Issue = CollectionEntry<'magazineIssues'>['data'];

export const LANGS: Lang[] = ['ja', 'en', 'no'];
export const SITE = 'https://scandijapandi.no';
export const ISSUE_ID = 'issue-01';

/** Japanese is primary and lives at /kitanote (the business card and QR URL). */
export const BASE: Record<Lang, string> = {
  ja: '/kitanote',
  en: '/kitanote/en',
  no: '/kitanote/no',
};

/** <html lang> / hreflang per language. */
export const HTML_LANG: Record<Lang, string> = { ja: 'ja', en: 'en', no: 'nb' };
/** The storefront's `sj-lang` localStorage values. */
export const STORE_LANG: Record<Lang, string> = { ja: 'jp', en: 'en', no: 'no' };

export const issueUrl = (lang: Lang) => BASE[lang];
export const chapterUrl = (lang: Lang, slug: string) => `${BASE[lang]}/${slug}`;
export const abs = (path: string) => (path.startsWith('http') ? path : `${SITE}${path}`);

export const t = (value: Localized | undefined, lang: Lang) => (value ? value[lang] : '');

/** A plain name, or a localized note. */
export const tn = (value: string | Localized, lang: Lang) => (typeof value === 'string' ? value : value[lang]);

/** Latin companion line under a Japanese title: English on the JA pages. */
export const latinLang = (lang: Lang): Exclude<Lang, 'ja'> => (lang === 'ja' ? 'en' : lang);

/** 「ヘルゲロア、ラベンダー、グーロ」 → phrases that never break inside. */
export const jpPhrases = (text: string) => text.match(/[^、。]+[、。]?/g) ?? [text];

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

/** "[utkast] Tekst" / "［仮］テキスト" → { draft: true, text } so the tag can be styled. */
export const splitDraft = (text: string) => {
  const m = text.match(/^\s*(?:\[(?:utkast|draft)\]|［仮］)\s*/i);
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

const MONTHS: Record<Exclude<Lang, 'ja'>, string[]> = {
  no: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
export const monthYear = (d: Date, lang: Lang) =>
  lang === 'ja' ? `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月` : `${MONTHS[lang][d.getUTCMonth()]} ${d.getUTCFullYear()}`;

/** Sender line, fixed wording from the brand guide. */
export const SENDER: Localized = {
  ja: '北の手 — Scandi Japandi Collection がお届けします',
  en: 'Kita no Te — presented by Scandi Japandi Collection',
  no: 'Kita no Te — presentert av Scandi Japandi Collection',
};

/** End-card heading for the product block. JP is always shown above. */
export const OBJECTS: Localized = {
  ja: 'この回の作品',
  en: 'Objects in this episode',
  no: 'Objektene i denne episoden',
};

/** Interface copy. Editorial copy lives in src/content/kitanote. */
export const UI = {
  ja: {
    ogLocale: 'ja_JP',
    langName: '日本語',
    shop: 'ショップ',
    issueLabel: (n: string, season: string) => `第${Number(n)}号 · ${season}`,
    letter: '手紙',
    contents: '目次',
    chaptersInIssue: 'この号の章',
    chapter: '章',
    chapterN: (n: string) => `第${Number(n)}章`,
    readChapter: '章を読む',
    film: '映像',
    watchFilm: '映像を見る',
    playFilm: '映像を再生',
    withCaptions: '日本語字幕',
    conversation: '対話',
    gallery: '写真',
    objectsComing: '作品は、まもなくショップに並びます',
    objectsComingBody: '紹介する作品を準備しています。それまでは、作り手との仕事の進め方をご覧ください。',
    episode: 'エピソードを見る',
    seeObject: '作品を見る',
    next: '次の章',
    backToIssue: '目次に戻る',
    coming: '撮影予定',
    comingTitle: 'この号の、これからの章',
    comingBody: 'さらに二つの章を10月に撮影し、撮影後にこの号に加えます。',
    chapterCount: (n: number) => `全${n}章`,
    filming: '撮影',
    colophon: '奥付',
    channel: 'チャンネル',
    channelTitle: 'エピソードとお知らせ',
    channelBody: '工房での記録は、YouTubeとエピソードページで公開します。新しい回のお知らせはLINEでお届けします。',
    allEpisodes: 'すべてのエピソード',
    line: 'LINEで友だち追加',
    latest: '最新エピソード',
    forMakers: '作り手の方へ',
    forMakersBody: '北欧・バルトの作り手で、日本の視聴者に自分の言葉で語りたい方。',
    forMakersLink: '詳しく見る',
    forMedia: 'メディア・パートナーの方へ',
    forMediaBody: '北欧の工房から届く映像を、貴媒体のチャンネルでお届けしませんか。',
    draft: '下書き',
    draftTitle: '下書き。承認前の文章です',
    titleDraft: 'タイトル仮',
    jpQa: '翻訳確認中',
    jpQaTitle: 'ネイティブによる日本語の確認前です',
    placeholderMedia: '仮の映像',
    pauseMotion: '動きを止める',
    playMotion: '動きを再生',
    langHint: 'ほかの言語でも読めます',
    skip: '本文へ移動',
    maker: '作り手',
    place: '場所',
    craft: '素材',
    website: 'ウェブサイト',
    credits: 'クレジット',
    languages: '言語',
    magazine: 'マガジン',
  },
  en: {
    ogLocale: 'en_GB',
    langName: 'English',
    shop: 'Shop',
    issueLabel: (n: string, season: string) => `Issue ${n} · ${season}`,
    letter: 'Letter',
    contents: 'Contents',
    chaptersInIssue: 'Chapters in this issue',
    chapter: 'Chapter',
    chapterN: (n: string) => `Chapter ${n}`,
    readChapter: 'Read the chapter',
    film: 'Film',
    watchFilm: 'Watch the film',
    playFilm: 'Play the film',
    withCaptions: 'Japanese, English and Norwegian captions',
    conversation: 'The conversation',
    gallery: 'Photographs',
    objectsComing: 'The objects are coming to the shop',
    objectsComingBody: 'A small selection is being prepared. Until then, read about how we work with makers.',
    episode: 'Watch the episode',
    seeObject: 'View object',
    next: 'Next chapter',
    backToIssue: 'Back to contents',
    coming: 'Coming',
    comingTitle: 'Later in this issue',
    comingBody: 'Two more chapters are filmed in October and join the issue after the shoot.',
    chapterCount: (n: number) => `${n} chapters`,
    filming: 'Filming',
    colophon: 'Colophon',
    channel: 'The channel',
    channelTitle: 'Episodes and updates',
    channelBody: 'The workshop films are published on YouTube and on the episode pages. New episodes are announced on LINE.',
    allEpisodes: 'All episodes',
    line: 'Add us on LINE',
    latest: 'Latest episodes',
    forMakers: 'For makers',
    forMakersBody: 'Nordic and Baltic makers who want to speak to Japanese viewers in their own words.',
    forMakersLink: 'Read more',
    forMedia: 'For media partners',
    forMediaBody: 'Carry film from Nordic workshops in your own channels.',
    draft: 'Draft',
    draftTitle: 'Draft, not approved copy',
    titleDraft: 'Working title',
    jpQa: '翻訳確認中',
    jpQaTitle: 'Japanese not yet reviewed by a native speaker',
    placeholderMedia: 'Placeholder media',
    pauseMotion: 'Pause motion',
    playMotion: 'Play motion',
    langHint: 'Also available in other languages',
    skip: 'Skip to content',
    maker: 'Maker',
    place: 'Place',
    craft: 'Material',
    website: 'Website',
    credits: 'Credits',
    languages: 'Language',
    magazine: 'Magazine',
  },
  no: {
    ogLocale: 'nb_NO',
    langName: 'Norsk',
    shop: 'Butikk',
    issueLabel: (n: string, season: string) => `Nummer ${n} · ${season}`,
    letter: 'Brev',
    contents: 'Innhold',
    chaptersInIssue: 'Kapitler i dette nummeret',
    chapter: 'Kapittel',
    chapterN: (n: string) => `Kapittel ${n}`,
    readChapter: 'Les kapittelet',
    film: 'Film',
    watchFilm: 'Se filmen',
    playFilm: 'Spill av filmen',
    withCaptions: 'Japansk, engelsk og norsk teksting',
    conversation: 'Samtalen',
    gallery: 'Bilder',
    objectsComing: 'Objektene kommer til butikken',
    objectsComingBody: 'Vi forbereder et lite utvalg. Til da kan du lese om hvordan vi arbeider med håndverkere.',
    episode: 'Se episoden',
    seeObject: 'Se objektet',
    next: 'Neste kapittel',
    backToIssue: 'Tilbake til innholdet',
    coming: 'Kommer',
    comingTitle: 'Senere i dette nummeret',
    comingBody: 'To kapitler til filmes i oktober og legges inn i nummeret etter opptak.',
    chapterCount: (n: number) => `${n} kapitler`,
    filming: 'Filmes',
    colophon: 'Kolofon',
    channel: 'Kanalen',
    channelTitle: 'Episoder og nytt',
    channelBody: 'Filmene fra verkstedene publiseres på YouTube og på episodesidene. Nye episoder varsles på LINE.',
    allEpisodes: 'Alle episoder',
    line: 'Legg oss til på LINE',
    latest: 'Siste episoder',
    forMakers: 'For håndverkere',
    forMakersBody: 'Nordiske og baltiske håndverkere som vil snakke til japanske seere med egne ord.',
    forMakersLink: 'Les mer',
    forMedia: 'For mediepartnere',
    forMediaBody: 'Vis film fra nordiske verksteder i egne kanaler.',
    draft: 'Utkast',
    draftTitle: 'Utkast, ikke godkjent tekst',
    titleDraft: 'Arbeidstittel',
    jpQa: '翻訳確認中',
    jpQaTitle: 'Japansk er ikke kvalitetssikret av en morsmålsbruker',
    placeholderMedia: 'Plassholdermedier',
    pauseMotion: 'Pause bevegelse',
    playMotion: 'Spill bevegelse',
    langHint: 'Finnes også på andre språk',
    skip: 'Hopp til innholdet',
    maker: 'Maker',
    place: 'Sted',
    craft: 'Materiale',
    website: 'Nettsted',
    credits: 'Kreditter',
    languages: 'Språk',
    magazine: 'Magasin',
  },
} as const;

export type UIStrings = (typeof UI)[Lang];
