// Shared field helpers for the 北の手 · Kita no Te magazine schemas.
// Japanese is the primary language and comes first; NO and EN follow.
export const localizedString = (name: string, title: string, rows?: number) => ({
  name,
  title,
  type: 'object',
  fields: [
    { name: 'ja', title: '日本語 (です/ます)', type: rows ? 'text' : 'string', ...(rows ? { rows } : {}) },
    { name: 'no', title: 'Norsk', type: rows ? 'text' : 'string', ...(rows ? { rows } : {}) },
    { name: 'en', title: 'English', type: rows ? 'text' : 'string', ...(rows ? { rows } : {}) },
  ],
})

export const localizedBlocks = (name: string, title: string) => ({
  name,
  title,
  type: 'object',
  fields: [
    { name: 'ja', title: '日本語 (です/ます)', type: 'array', of: [{ type: 'block' }] },
    { name: 'no', title: 'Norsk', type: 'array', of: [{ type: 'block' }] },
    { name: 'en', title: 'English', type: 'array', of: [{ type: 'block' }] },
  ],
})

/** Loop or film source. `src` takes an MP4 path today, an HLS URL later. */
export const videoSource = (name: string, title: string, extra: any[] = []) => ({
  name,
  title,
  type: 'object',
  fields: [
    { name: 'src', title: 'Kilde (MP4 eller HLS-URL)', type: 'string' },
    { name: 'type', title: 'Type', type: 'string', options: { list: ['mp4', 'hls'] }, initialValue: 'mp4' },
    { name: 'srcMobile', title: 'Mobil-kilde (4:5)', type: 'string' },
    { name: 'srcFallback', title: 'MP4-reserve for HLS', type: 'string' },
    { name: 'poster', title: 'Poster', type: 'image' },
    { name: 'posterMobile', title: 'Mobil-poster (4:5)', type: 'image' },
    localizedString('alt', 'Alt-tekst for poster'),
    { name: 'placeholder', title: 'Plassholder', type: 'boolean', initialValue: false },
    ...extra,
  ],
})

/** Japanese reviewed by a native speaker. Unchecked: 「翻訳確認中」 tag and noindex. */
export const jpQa = {
  name: 'jpQa',
  title: 'Japansk kvalitetssikret (native QA)',
  description: 'Av: siden viser 「翻訳確認中」 og får noindex på alle språk.',
  type: 'boolean',
  initialValue: false,
}
