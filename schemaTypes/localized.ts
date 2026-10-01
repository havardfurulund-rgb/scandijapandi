// Shared field helpers for the bilingual magazine schemas (NO + EN).
export const localizedString = (name: string, title: string, rows?: number) => ({
  name,
  title,
  type: 'object',
  fields: [
    { name: 'no', title: 'Norsk', type: rows ? 'text' : 'string', ...(rows ? { rows } : {}) },
    { name: 'en', title: 'English', type: rows ? 'text' : 'string', ...(rows ? { rows } : {}) },
  ],
})

export const localizedBlocks = (name: string, title: string) => ({
  name,
  title,
  type: 'object',
  fields: [
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
