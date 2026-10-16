-- Market-aligned price adjustment (Havard 16.10.2026: wool and tailoring are
-- priced too high; gentler, market-aligned pricing that stays premium).
--
-- *** REQUIRES HAVARD'S GO before merge. Benchmarks and rationale are in the
-- *** PR description. Supersedes the price levels set in 20261014120000 and
-- *** 20261014130000 for the rows below; nothing else is touched.
--
-- JPY = NOK x 16.6, rounded to Japanese price points (...800).
-- price_nok is what Stripe charges; price_jpy is display only.

-- Stammehandverk / Dyra pa Garden (one of one, hand-knit)      before -> after
UPDATE products SET price_nok = 6900, price_jpy = 114800, updated_at = NOW() WHERE slug = 'dyra-yoke-sweater-nordic-pattern'; -- 12000 / 198000
UPDATE products SET price_nok = 5900, price_jpy = 97800,  updated_at = NOW() WHERE slug = 'dyra-natural-brown-cardigan';      -- 10500 / 174800
UPDATE products SET price_nok = 2400, price_jpy = 39800,  updated_at = NOW() WHERE slug = 'dyra-lace-scarf-undyed-cream';     --  4800 /  79800
UPDATE products SET price_nok = 1900, price_jpy = 31800,  updated_at = NOW() WHERE slug = 'dyra-alpaca-motif-knitted-bag';    --  3600 /  59800
UPDATE products SET price_nok = 1200, price_jpy = 19800,  updated_at = NOW() WHERE slug = 'dyra-ribbed-beanie-natural-brown'; --  2400 /  39800
UPDATE products SET price_nok = 890,  price_jpy = 14800,  updated_at = NOW() WHERE slug = 'dyra-farm-socks-heather-grey';     --  1800 /  29800

-- Stammehandverk / Skredderen fra Damaskus (made to measure, "from" prices)
UPDATE products SET price_nok = 3400,  price_jpy = 56800,  updated_at = NOW() WHERE slug = 'skredderen-bespoke-shirt';      --  4800 /  79800
UPDATE products SET price_nok = 4900,  price_jpy = 81800,  updated_at = NOW() WHERE slug = 'skredderen-bespoke-trousers';   --  6500 / 107800
UPDATE products SET price_nok = 11800, price_jpy = 195800, updated_at = NOW() WHERE slug = 'skredderen-bespoke-jacket';     -- 12800 / 212800
UPDATE products SET price_nok = 650,   price_jpy = 10800,  updated_at = NOW() WHERE slug = 'skredderen-alteration-recut';   --  1200 /  19800

-- Laagen Flow (Stammehandverk)
UPDATE products SET price_nok = 3490, price_jpy = 57800, updated_at = NOW() WHERE slug = 'ullgenser-fra-laagen-flow';          -- 4800 /  79800
UPDATE products SET price_nok = 4900, price_jpy = 81800, updated_at = NOW() WHERE slug = 'handvevd-linhoodie-fra-laagen-flow'; -- 6500 / 107800
UPDATE products SET price_nok = 2900, price_jpy = 47800, updated_at = NOW() WHERE slug = 'handvevd-linndekke-lofoten';         -- 3900 /  64800
UPDATE products SET price_nok = 1200, price_jpy = 19800, updated_at = NOW() WHERE slug = 'minimalistisk-keramikkvase';         -- 2400 /  39800 (Ulllue fra Laagen Flow)
