-- Scandi Japandi copy rule (Havard 16.10.2026): the platform never names the
-- farm the Stammehandverk makers work at, never mentions the 500+ goal and
-- does not single out makers. The farm tie-in belongs to stammehandverk.no only.
-- This rewrites the customer-facing fields set in 20261014120000 for the ten
-- Dyra på Gården / Skredderen fra Damaskus rows. Prices are not touched.

UPDATE products SET producer_location = 'Norway', updated_at = NOW()
WHERE brand_slug IN ('dyra-pa-garden', 'skredderen-fra-damaskus');

-- Dyra på Gården
UPDATE products SET
  description    = 'A one-of-a-kind sweater knitted by hand on a small farm in Norway, with a traditional patterned yoke worked stitch by stitch. Wool from the farm''s own animals. No two are alike: this is the only one.',
  description_en = 'A one-of-a-kind sweater knitted by hand on a small farm in Norway, with a traditional patterned yoke worked stitch by stitch. Wool from the farm''s own animals. No two are alike: this is the only one.',
  updated_at = NOW()
WHERE slug = 'dyra-yoke-sweater-nordic-pattern';

UPDATE products SET
  description    = 'A deep-ribbed hat in undyed brown wool, with a folded brim. Simple and soft. Hand-knit in Norway. One size.',
  description_en = 'A deep-ribbed hat in undyed brown wool, with a folded brim. Simple and soft. Hand-knit in Norway. One size.',
  updated_at = NOW()
WHERE slug = 'dyra-ribbed-beanie-natural-brown';

-- Skredderen fra Damaskus
UPDATE products SET
  description    = 'Cut and sewn by hand to your own measurements by Skredderen fra Damaskus, a tailor working in Norway. Not off-the-rack: made to measure (skreddersøm etter mål). The garment is cut for you alone.',
  description_en = 'Cut and sewn by hand to your own measurements by Skredderen fra Damaskus, a tailor working in Norway. Not off-the-rack: made to measure (skreddersøm etter mål). The garment is cut for you alone.',
  updated_at = NOW()
WHERE slug IN ('skredderen-bespoke-shirt', 'skredderen-bespoke-trousers', 'skredderen-bespoke-jacket');

UPDATE products SET
  description    = 'Bring a garment you already love and have it re-cut to your measurements by Skredderen fra Damaskus, a tailor working in Norway. Made to measure (skreddersøm etter mål): adjusted for one body, by hand.',
  description_en = 'Bring a garment you already love and have it re-cut to your measurements by Skredderen fra Damaskus, a tailor working in Norway. Made to measure (skreddersøm etter mål): adjusted for one body, by hand.',
  updated_at = NOW()
WHERE slug = 'skredderen-alteration-recut';

-- Safety net: any other product text (incl. Japanese/admin-edited fields) that
-- still names the farm gets the name replaced with a neutral phrase.
UPDATE products SET
  description_jp    = NULLIF(regexp_replace(COALESCE(description_jp, ''), '(at |on )?Langr(ø|o)nningen(, a farm in Norway)?', 'in Norway', 'gi'), ''),
  producer_location = regexp_replace(producer_location, 'Langr(ø|o)nningen,?\s*', '', 'gi'),
  description       = regexp_replace(description,    '(at |on )?Langr(ø|o)nningen(, a farm in Norway)?', 'in Norway', 'gi'),
  description_en    = regexp_replace(description_en, '(at |on )?Langr(ø|o)nningen(, a farm in Norway)?', 'in Norway', 'gi'),
  producer_story    = regexp_replace(producer_story, '(at |on )?Langr(ø|o)nningen(, a farm in Norway)?', 'in Norway', 'gi'),
  origin_story      = regexp_replace(origin_story,   '(at |on )?Langr(ø|o)nningen(, a farm in Norway)?', 'in Norway', 'gi'),
  updated_at = NOW()
WHERE description ~* 'langr(ø|o)nningen' OR description_en ~* 'langr(ø|o)nningen'
   OR description_jp ~* 'langr(ø|o)nningen' OR producer_location ~* 'langr(ø|o)nningen'
   OR producer_story ~* 'langr(ø|o)nningen' OR origin_story ~* 'langr(ø|o)nningen';
