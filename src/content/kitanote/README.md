# 北の手 · Kita no Te — innhold / content

Ett sted å redigere magasinet. Endringer her bygges statisk ved neste deploy.
Japansk er hovedspråket (`/kitanote`), engelsk og norsk ligger under
`/kitanote/en` og `/kitanote/no`. Alle tekstfelt har `ja`, `en` og `no`.

- `issues/issue-01.yaml` — nummeret: cover-film, «Brev fra Norge», kapittelrekkefølge, kolofon.
- `chapters/*.yaml` — ett kapittel per maker. Skjema: `src/content.config.ts`.

Flagg:

- `draft: true` — teksten er et utkast. Viser et diskret «Utkast / Draft / 下書き»-merke.
- `jp_qa: false` — japansk er ikke kvalitetssikret av en morsmålsbruker. Viser
  「翻訳確認中」 og setter `noindex` på alle språkversjoner av siden.
- `title_draft: true` — tittelen (sted + materiale + person) må bekreftes.
- `placeholder: true` (på media) — plassholder generert av
  `scripts/kitanote/make-placeholders.sh`. Byttes med ekte opptak.
- `status: published | coming | hidden` — `coming` vises som «Filmes oktober 2026»-kort,
  `hidden` vises ikke. `published: false` skjuler kapitlet helt.
- `product_slugs` — lenker til `/products/[slug]`. `producer_name_match` matcher
  `producer` i `/api/products` i nettleseren (progressiv forbedring).
- `story_slug` — når episoden er publisert på `/stories/[slug]`, lenker kapitlet dit.
- Slugen kan ikke være `en`, `no`, `ja` eller `jp` (kolliderer med språkmappene).

Tittelmønster: sted + materiale + person, f.eks. 「ヘルゲロア、ラベンダー、グーロ」 /
«Helgeroa. Lavendel. Guro.». Japansk skrives i です/ます. Ingen ros, ingen salg.

Sitater merket `[utkast]` / `［仮］` er IKKE ekte sitater. Bytt dem ut etter intervjuene.
