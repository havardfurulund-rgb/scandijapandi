export default {
  name: 'product',
  title: 'Produkter',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Produktnavn',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug (Nettadresse-lenke)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'mainImage',
      title: 'Hovedbilde (Stiplet drag-and-drop)',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'gallery',
      title: 'Bildegalleri (Flere bilder)',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    },
    {
      name: 'price',
      title: 'Pris (NOK)',
      type: 'number',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'curator',
      title: 'Tilknyttet Kurator / Influenser',
      type: 'reference',
      to: [{ type: 'curator' }], // Sørger for at vi kan koble på margin-logikken senere
    },
    {
      name: 'description',
      title: 'Beskrivelse (Norsk)',
      type: 'text',
    },
    {
      name: 'description_jp',
      title: 'Beskrivelse (Japansk)',
      type: 'text',
    },
    {
      // Eldre rik-tekst-felt fra et tidligere skjema. Eksisterende produkter i
      // databasen har fortsatt data her, noe som ga «Unknown field found» i
      // Studio. Feltet er nå definert slik at innholdet valideres. Bruk
      // «Beskrivelse (Norsk)» for ny tekst — dette feltet beholdes kun for
      // bakoverkompatibilitet og kan tømmes per produkt.
      name: 'body',
      title: 'Brødtekst (utdatert – bruk Beskrivelse)',
      type: 'array',
      of: [{ type: 'block' }],
    }
  ],
}
