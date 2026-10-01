// «Hender fra Nord» issue. Mirrors magazineIssues in src/content.config.ts.
import { localizedString, localizedBlocks, videoSource } from './localized'

export default {
  name: 'magazineIssue',
  title: 'Hender fra Nord · Nummer',
  type: 'document',
  fields: [
    { name: 'number', title: 'Nummer', type: 'number', validation: (Rule: any) => Rule.required().min(1) },
    localizedString('title', 'Tittel'),
    localizedString('season', 'Sesong'),
    { name: 'publishedAt', title: 'Publiseringsdato', type: 'date' },
    { name: 'draft', title: 'Utkast', type: 'boolean', initialValue: true },
    localizedString('manifest', 'Manifest (én linje)'),
    videoSource('coverLoop', 'Cover-loop'),
    { name: 'ogImage', title: 'Delingsbilde', type: 'image' },
    {
      name: 'editorLetter',
      title: 'Leder',
      type: 'object',
      fields: [
        localizedString('title', 'Tittel'),
        localizedBlocks('body', 'Tekst (120–180 ord)'),
        { name: 'signature', title: 'Signatur', type: 'string' },
        localizedString('role', 'Rolle'),
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
            },
          ],
        },
        localizedString('note', 'Merknad', 3),
      ],
    },
  ],
  preview: { select: { title: 'title.no', subtitle: 'season.no' } },
}
