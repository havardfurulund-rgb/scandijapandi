export default {
  name: 'curator',
  title: 'Kuratorer / Influensere',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Navn',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'instagramHandle',
      title: 'Instagram-brukernavn',
      type: 'string',
    },
    {
      name: 'commissionRate',
      title: 'Provisjon / Margin (%)',
      type: 'number',
      description: 'Hvor mange prosent av salget skal denne kuratoren ha?',
      validation: (Rule: any) => Rule.min(0).max(100),
    },
    {
      name: 'slug',
      title: 'Unik ID (Brukt til sporingslenke)',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    }
  ],
}
