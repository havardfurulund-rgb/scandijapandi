// «Hender fra Nord» chapter, one per maker. Mirrors the Astro content
// collection in src/content.config.ts (makerChapters) so Studio can take over
// the YAML in src/content/hender-fra-nord/chapters without page changes.
import { localizedBlocks, localizedString, videoSource } from './localized'

export default {
  name: 'makerChapter',
  title: 'Hender fra Nord · Kapittel',
  type: 'document',
  fields: [
    { name: 'makerName', title: 'Maker', type: 'string', validation: (Rule: any) => Rule.required() },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'makerName', maxLength: 64 },
      validation: (Rule: any) => Rule.required(),
    },
    { name: 'order', title: 'Rekkefølge', type: 'number' },
    { name: 'published', title: 'Publisert', type: 'boolean', initialValue: true },
    { name: 'draft', title: 'Utkast (viser «Utkast»-merke)', type: 'boolean', initialValue: true },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['published', 'coming', 'hidden'], layout: 'radio' },
      initialValue: 'published',
    },
    { name: 'makerPerson', title: 'Person', type: 'string' },
    { name: 'website', title: 'Nettsted', type: 'url' },
    localizedString('location', 'Sted'),
    localizedString('craft', 'Håndverk'),
    localizedString('title', 'Tittel'),
    localizedString('dek', 'Ingress', 3),
    localizedBlocks('body', 'Brødtekst'),
    {
      name: 'interview',
      title: 'Intervju',
      type: 'array',
      of: [{ type: 'object', fields: [localizedString('q', 'Spørsmål'), localizedString('a', 'Svar', 5)] }],
    },
    {
      name: 'quotes',
      title: 'Sitater',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            localizedString('text', 'Sitat', 2),
            { name: 'attribution', title: 'Kilde', type: 'string' },
            { name: 'after', title: 'Vis etter svar nr. (0 = første)', type: 'number' },
            { name: 'draft', title: 'Utkast (ikke godkjent sitat)', type: 'boolean', initialValue: true },
          ],
        },
      ],
    },
    videoSource('heroLoop', 'Hero-loop (6–12 s, uten lyd)'),
    videoSource('film', 'Hovedfilm', [
      { name: 'duration', title: 'Varighet (sekunder)', type: 'number' },
      { name: 'captionsNo', title: 'Teksting NO (.vtt)', type: 'file', options: { accept: '.vtt' } },
      { name: 'captionsEn', title: 'Teksting EN (.vtt)', type: 'file', options: { accept: '.vtt' } },
    ]),
    {
      name: 'gallery',
      title: 'Bildeessay',
      type: 'array',
      of: [
        {
          type: 'image',
          fields: [
            localizedString('alt', 'Alt-tekst'),
            localizedString('caption', 'Bildetekst'),
            { name: 'credit', title: 'Kreditt', type: 'string' },
            { name: 'placeholder', title: 'Plassholder', type: 'boolean', initialValue: false },
          ],
        },
      ],
    },
    { name: 'productSlugs', title: 'Produkt-slugs (/products/[slug])', type: 'array', of: [{ type: 'string' }] },
    {
      name: 'producerNameMatch',
      title: 'Produsentnavn i butikken',
      description: 'Matches mot «producer» i /api/products i nettleseren.',
      type: 'string',
    },
    { name: 'shootDate', title: 'Opptaksdato', type: 'date' },
    { name: 'teaserImage', title: 'Bilde for «Kommer»-kort', type: 'image' },
    {
      name: 'credits',
      title: 'Kreditter',
      type: 'array',
      of: [{ type: 'object', fields: [localizedString('role', 'Rolle'), { name: 'name', title: 'Navn', type: 'string' }] }],
    },
  ],
  orderings: [{ title: 'Rekkefølge', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'makerName', subtitle: 'status' } },
}
