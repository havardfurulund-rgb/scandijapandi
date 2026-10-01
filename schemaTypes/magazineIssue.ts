// 北の手 · Kita no Te issue (Issue 01: «Hender fra Nord»).
// Mirrors magazineIssues in src/content.config.ts.
import { jpQa, localizedString, localizedBlocks, videoSource } from './localized'

export default {
  name: 'magazineIssue',
  title: '北の手 · Nummer',
  type: 'document',
  fields: [
    { name: 'number', title: 'Nummer', type: 'number', validation: (Rule: any) => Rule.required().min(1) },
    localizedString('title', 'Tittel'),
    localizedString('season', 'Sesong'),
    { name: 'publishedAt', title: 'Publiseringsdato', type: 'date' },
    { name: 'draft', title: 'Utkast', type: 'boolean', initialValue: true },
    jpQa,
    localizedString('manifest', 'Manifest (én linje)'),
    videoSource('coverLoop', 'Cover-loop'),
    { name: 'ogImage', title: 'Delingsbilde', type: 'image' },
    {
      name: 'letter',
      title: 'Brev fra Norge / ノルウェーからの手紙',
      description: 'Kuratoren er usynlig: ingen portrett, signert med rolle.',
      type: 'object',
      fields: [
        localizedString('title', 'Tittel'),
        localizedBlocks('body', 'Tekst (120–180 ord)'),
        localizedString('signature', 'Signatur (f.eks. キュレーター / Curator / Kurator)'),
        { name: 'draft', title: 'Utkast', type: 'boolean', initialValue: true },
      ],
    },
    {
      name: 'chapters',
      title: 'Kapitler',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'makerChapter' }] }],
    },
    {
      name: 'colophon',
      title: 'Kolofon',
      type: 'object',
      fields: [
        {
          name: 'entries',
          title: 'Linjer',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [localizedString('role', 'Rolle'), { name: 'names', title: 'Navn', type: 'array', of: [{ type: 'string' }] }],
              // Notes such as «Plassholder» are localized in the YAML; Studio keeps plain names.
            },
          ],
        },
        localizedString('note', 'Merknad', 3),
      ],
    },
  ],
  preview: { select: { title: 'title.ja', subtitle: 'season.no' } },
}
