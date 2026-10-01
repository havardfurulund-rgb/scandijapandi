# Hender fra Nord — innhold / content

Ett sted å redigere magasinet. Endringer her bygges statisk ved neste deploy.

- `issues/issue-01.yaml` — nummeret: cover-film, leder, kapittelrekkefølge, kolofon.
- `chapters/*.yaml` — ett kapittel per maker. Skjema: `src/content.config.ts`.

Flagg:

- `draft: true` — teksten er et utkast. Viser et diskret «Utkast / Draft»-merke.
- `placeholder: true` (på media) — plassholder generert av
  `scripts/hender-fra-nord/make-placeholders.sh`. Byttes med ekte opptak.
- `status: published | coming | hidden` — `coming` vises som «Filmes oktober 2026»-kort,
  `hidden` vises ikke. `published: false` skjuler kapitlet helt.
- `product_slugs` — lenker til `/products/[slug]`. `producer_name_match` matcher
  `producer` i `/api/products` i nettleseren (progressiv forbedring).

Sitater merket `[utkast]` er IKKE ekte sitater. Bytt dem ut etter intervjuene.
