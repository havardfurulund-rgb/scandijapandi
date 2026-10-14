-- Japan launch (Oct 2026): Stammehandverk / Dyra på Gården (6 hand-knit wool
-- pieces) and Stammehandverk / Skredderen fra Damaskus (4 made-to-measure
-- listings). Source copy: content/launch/copy/PRODUCTS.md (CoS, approved by
-- Havard 13.10.2026). Customer-facing copy is English only (Japan market).
--
-- Rules applied here:
--   * Scandi Japandi is a curated platform, not a producer: every row is
--     credited "Stammehandverk / <brand>", never "our wool".
--   * Facts marked [CONFIRM] in the source are NOT written. Where a product
--     page needs a value, it reads "Details on request".
--   * Listing images are the real studio cutouts only (public/launch/products).
--   * Dyra pieces are one-of-a-kind: stock_quantity = 1.
--   * Skredderen listings are made to measure: product_type = 'made_to_measure',
--     price_from = TRUE (prices shown as "from"), no add-to-cart, enquiry only.
--   * price_jpy uses the fixed launch rate 16.6 JPY/NOK, rounded to Japanese
--     price points (…800) as in the source table.
--
-- Idempotent: re-running updates the same slugs.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type  TEXT NOT NULL DEFAULT 'product',   -- 'product' | 'made_to_measure'
  ADD COLUMN IF NOT EXISTS price_from    BOOLEAN NOT NULL DEFAULT FALSE,    -- show price as "from …"
  ADD COLUMN IF NOT EXISTS brand_slug    TEXT,                              -- links product → /makers/<brand_slug>
  ADD COLUMN IF NOT EXISTS one_of_a_kind BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS products_brand_slug_idx ON products (brand_slug);

-- ---------------------------------------------------------------------------
-- Stammehandverk / Dyra på Gården — 6 one-of-a-kind wool pieces
-- ---------------------------------------------------------------------------
INSERT INTO products (
  slug, name, name_en, producer, producer_location, brand_slug,
  description, description_en,
  material, care_instructions, dimensions,
  price_nok, price_jpy, image_url, gallery_urls,
  stock_quantity, one_of_a_kind, product_type, price_from,
  country_of_origin, active
) VALUES
(
  'dyra-yoke-sweater-nordic-pattern',
  'Yoke Sweater: Nordic Pattern',
  'Yoke Sweater: Nordic Pattern',
  'Stammehandverk / Dyra på Gården', 'Langrønningen, Norway', 'dyra-pa-garden',
  'A one-of-a-kind sweater knitted by hand at Langrønningen, a farm in Norway, with a traditional patterned yoke worked stitch by stitch. Wool from the farm''s own animals. No two are alike: this is the only one.',
  'A one-of-a-kind sweater knitted by hand at Langrønningen, a farm in Norway, with a traditional patterned yoke worked stitch by stitch. Wool from the farm''s own animals. No two are alike: this is the only one.',
  'Hand-knit in Norway from the farm''s own fibre · Details on request',
  'Hand wash cold, dry flat',
  'Size: details on request',
  12000, 198000, '/launch/products/dyra-5475-4x5.jpg', '["/launch/products/dyra-5475-sq.jpg"]'::jsonb,
  1, TRUE, 'product', FALSE,
  'Norway', TRUE
),
(
  'dyra-natural-brown-cardigan',
  'Natural Brown Cardigan',
  'Natural Brown Cardigan',
  'Stammehandverk / Dyra på Gården', 'Langrønningen, Norway', 'dyra-pa-garden',
  'Knitted in the natural colour of the fleece. No dye, just the colour the animal grew. A quiet, heavy cardigan meant to be worn for decades. One of one.',
  'Knitted in the natural colour of the fleece. No dye, just the colour the animal grew. A quiet, heavy cardigan meant to be worn for decades. One of one.',
  'Hand-knit in Norway · Details on request',
  'Hand wash cold, dry flat',
  'Size: details on request',
  10500, 174800, '/launch/products/dyra-5476-4x5.jpg', '["/launch/products/dyra-5476-sq.jpg"]'::jsonb,
  1, TRUE, 'product', FALSE,
  'Norway', TRUE
),
(
  'dyra-lace-scarf-undyed-cream',
  'Lace Scarf: Undyed Cream',
  'Lace Scarf: Undyed Cream',
  'Stammehandverk / Dyra på Gården', 'Langrønningen, Norway', 'dyra-pa-garden',
  'An open lace scarf, light enough to wear indoors, warm enough for a Hokkaido winter. Hand-knit from farm fibre. One of one.',
  'An open lace scarf, light enough to wear indoors, warm enough for a Hokkaido winter. Hand-knit from farm fibre. One of one.',
  'Hand-knit in Norway from farm fibre · Details on request',
  'Hand wash cold, dry flat',
  'Length: details on request',
  4800, 79800, '/launch/products/dyra-5479-4x5.jpg', '["/launch/products/dyra-5479-sq.jpg"]'::jsonb,
  1, TRUE, 'product', FALSE,
  'Norway', TRUE
),
(
  'dyra-alpaca-motif-knitted-bag',
  'Alpaca Motif Knitted Bag',
  'Alpaca Motif Knitted Bag',
  'Stammehandverk / Dyra på Gården', 'Langrønningen, Norway', 'dyra-pa-garden',
  'A small knitted bag with an alpaca worked into the front. A portrait of one of the animals that gives the wool. Hand-knit, with a shoulder strap. One of one.',
  'A small knitted bag with an alpaca worked into the front. A portrait of one of the animals that gives the wool. Hand-knit, with a shoulder strap. One of one.',
  'Hand-knit in Norway · Details on request',
  'Hand wash cold, dry flat',
  'Dimensions: details on request',
  3600, 59800, '/launch/products/dyra-5477-4x5.jpg', '["/launch/products/dyra-5477-sq.jpg"]'::jsonb,
  1, TRUE, 'product', FALSE,
  'Norway', TRUE
),
(
  'dyra-ribbed-beanie-natural-brown',
  'Ribbed Beanie: Natural Brown',
  'Ribbed Beanie: Natural Brown',
  'Stammehandverk / Dyra på Gården', 'Langrønningen, Norway', 'dyra-pa-garden',
  'A deep-ribbed hat in undyed brown wool, with a folded brim. Simple and soft. Made at Langrønningen. One size.',
  'A deep-ribbed hat in undyed brown wool, with a folded brim. Simple and soft. Made at Langrønningen. One size.',
  'Hand-knit in Norway, undyed wool · Details on request',
  'Hand wash cold, dry flat',
  'One size',
  2400, 39800, '/launch/products/dyra-5465-4x5.jpg', '["/launch/products/dyra-5465-sq.jpg"]'::jsonb,
  1, TRUE, 'product', FALSE,
  'Norway', TRUE
),
(
  'dyra-farm-socks-heather-grey',
  'Farm Socks: Heather Grey',
  'Farm Socks: Heather Grey',
  'Stammehandverk / Dyra på Gården', 'Langrønningen, Norway', 'dyra-pa-garden',
  'Thick hand-knit socks in heathered grey, the kind Norwegians wear in the cabin. Made for wooden floors and tatami.',
  'Thick hand-knit socks in heathered grey, the kind Norwegians wear in the cabin. Made for wooden floors and tatami.',
  'Hand-knit in Norway · Details on request',
  'Hand wash cold, dry flat',
  'Size: details on request',
  1800, 29800, '/launch/products/dyra-5469-4x5.jpg', '["/launch/products/dyra-5469-sq.jpg"]'::jsonb,
  1, TRUE, 'product', FALSE,
  'Norway', TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, name_en = EXCLUDED.name_en,
  producer = EXCLUDED.producer, producer_location = EXCLUDED.producer_location, brand_slug = EXCLUDED.brand_slug,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  material = EXCLUDED.material, care_instructions = EXCLUDED.care_instructions, dimensions = EXCLUDED.dimensions,
  price_nok = EXCLUDED.price_nok, price_jpy = EXCLUDED.price_jpy,
  image_url = EXCLUDED.image_url, gallery_urls = EXCLUDED.gallery_urls,
  stock_quantity = EXCLUDED.stock_quantity, one_of_a_kind = EXCLUDED.one_of_a_kind,
  product_type = EXCLUDED.product_type, price_from = EXCLUDED.price_from,
  country_of_origin = EXCLUDED.country_of_origin, active = EXCLUDED.active,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Stammehandverk / Skredderen fra Damaskus — made to measure (skreddersøm etter mål)
-- No garment photos exist yet: the brand mark is the placeholder image.
-- ---------------------------------------------------------------------------
INSERT INTO products (
  slug, name, name_en, producer, producer_location, brand_slug,
  description, description_en,
  material, care_instructions, dimensions,
  price_nok, price_jpy, image_url, gallery_urls,
  stock_quantity, one_of_a_kind, product_type, price_from,
  country_of_origin, active
) VALUES
(
  'skredderen-bespoke-shirt',
  'Bespoke Shirt: made to measure',
  'Bespoke Shirt: made to measure',
  'Stammehandverk / Skredderen fra Damaskus', 'Langrønningen, Norway', 'skredderen-fra-damaskus',
  'Cut and sewn by hand to your own measurements by Skredderen fra Damaskus, the tailor at Langrønningen, the Norwegian farm where Dyra på Gården''s wool pieces are also made. Not off-the-rack: made to measure (skreddersøm etter mål). The garment is cut for you alone.',
  'Cut and sewn by hand to your own measurements by Skredderen fra Damaskus, the tailor at Langrønningen, the Norwegian farm where Dyra på Gården''s wool pieces are also made. Not off-the-rack: made to measure (skreddersøm etter mål). The garment is cut for you alone.',
  'Fabric options on request', NULL, 'Made to your measurements',
  4800, 79800, '/brand/skredderen/skredderen-logo-dark-512.png', '[]'::jsonb,
  NULL, FALSE, 'made_to_measure', TRUE,
  'Norway', TRUE
),
(
  'skredderen-bespoke-trousers',
  'Bespoke Trousers: made to measure',
  'Bespoke Trousers: made to measure',
  'Stammehandverk / Skredderen fra Damaskus', 'Langrønningen, Norway', 'skredderen-fra-damaskus',
  'Cut and sewn by hand to your own measurements by Skredderen fra Damaskus, the tailor at Langrønningen, the Norwegian farm where Dyra på Gården''s wool pieces are also made. Not off-the-rack: made to measure (skreddersøm etter mål). The garment is cut for you alone.',
  'Cut and sewn by hand to your own measurements by Skredderen fra Damaskus, the tailor at Langrønningen, the Norwegian farm where Dyra på Gården''s wool pieces are also made. Not off-the-rack: made to measure (skreddersøm etter mål). The garment is cut for you alone.',
  'Fabric options on request', NULL, 'Made to your measurements',
  6500, 107800, '/brand/skredderen/skredderen-logo-dark-512.png', '[]'::jsonb,
  NULL, FALSE, 'made_to_measure', TRUE,
  'Norway', TRUE
),
(
  'skredderen-bespoke-jacket',
  'Bespoke Jacket: made to your measurements',
  'Bespoke Jacket: made to your measurements',
  'Stammehandverk / Skredderen fra Damaskus', 'Langrønningen, Norway', 'skredderen-fra-damaskus',
  'Cut and sewn by hand to your own measurements by Skredderen fra Damaskus, the tailor at Langrønningen, the Norwegian farm where Dyra på Gården''s wool pieces are also made. Not off-the-rack: made to measure (skreddersøm etter mål). The garment is cut for you alone.',
  'Cut and sewn by hand to your own measurements by Skredderen fra Damaskus, the tailor at Langrønningen, the Norwegian farm where Dyra på Gården''s wool pieces are also made. Not off-the-rack: made to measure (skreddersøm etter mål). The garment is cut for you alone.',
  'Fabric options on request', NULL, 'Made to your measurements',
  12800, 212800, '/brand/skredderen/skredderen-logo-dark-512.png', '[]'::jsonb,
  NULL, FALSE, 'made_to_measure', TRUE,
  'Norway', TRUE
),
(
  'skredderen-alteration-recut',
  'Alteration / re-cut of a treasured garment',
  'Alteration / re-cut of a treasured garment',
  'Stammehandverk / Skredderen fra Damaskus', 'Langrønningen, Norway', 'skredderen-fra-damaskus',
  'Bring a garment you already love and have it re-cut to your measurements by Skredderen fra Damaskus, the tailor at Langrønningen. Made to measure (skreddersøm etter mål): adjusted for one body, by hand.',
  'Bring a garment you already love and have it re-cut to your measurements by Skredderen fra Damaskus, the tailor at Langrønningen. Made to measure (skreddersøm etter mål): adjusted for one body, by hand.',
  NULL, NULL, 'Made to your measurements',
  1200, 19800, '/brand/skredderen/skredderen-logo-dark-512.png', '[]'::jsonb,
  NULL, FALSE, 'made_to_measure', TRUE,
  'Norway', TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, name_en = EXCLUDED.name_en,
  producer = EXCLUDED.producer, producer_location = EXCLUDED.producer_location, brand_slug = EXCLUDED.brand_slug,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  material = EXCLUDED.material, care_instructions = EXCLUDED.care_instructions, dimensions = EXCLUDED.dimensions,
  price_nok = EXCLUDED.price_nok, price_jpy = EXCLUDED.price_jpy,
  image_url = EXCLUDED.image_url, gallery_urls = EXCLUDED.gallery_urls,
  stock_quantity = EXCLUDED.stock_quantity, one_of_a_kind = EXCLUDED.one_of_a_kind,
  product_type = EXCLUDED.product_type, price_from = EXCLUDED.price_from,
  country_of_origin = EXCLUDED.country_of_origin, active = EXCLUDED.active,
  updated_at = NOW();
