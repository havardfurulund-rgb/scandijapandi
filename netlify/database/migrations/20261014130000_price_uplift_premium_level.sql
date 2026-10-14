-- Price uplift (CoS brief 13.10.2026, point 5): every existing Scandi Japandi
-- product moves up to the premium level, roughly +40–80 %, so nothing on the
-- platform undercuts the hand-knit Dyra pieces (¥29,800–¥198,000).
--
-- *** REQUIRES HAVARD'S GO. The BEFORE/AFTER table is in the PR description.
-- *** If GO is not given, delete this file before merge — the launch migration
-- *** (20261014120000) does not depend on it.
--
-- JPY = NOK × 16.6, rounded to Japanese price points (…800).
-- price_nok is what Stripe charges; price_jpy is display only.

-- Laagen Flow (Stammehandverk)                     before      after      +%
UPDATE products SET price_nok = 4800,  price_jpy = 79800,  updated_at = NOW() WHERE slug = 'ullgenser-fra-laagen-flow';         -- 2889 → 4800  +66 %
UPDATE products SET price_nok = 6500,  price_jpy = 107800, updated_at = NOW() WHERE slug = 'handvevd-linhoodie-fra-laagen-flow'; -- 3829 → 6500  +70 %
UPDATE products SET price_nok = 3900,  price_jpy = 64800,  updated_at = NOW() WHERE slug = 'handvevd-linndekke-lofoten';         -- 2450 → 3900  +59 %
UPDATE products SET price_nok = 2400,  price_jpy = 39800,  updated_at = NOW() WHERE slug = 'minimalistisk-keramikkvase';         -- 1450 → 2400  +66 %  (Ulllue fra Laagen Flow)

-- 'eikebolle-hardanger' is a leftover test row priced at 20 NOK on a live
-- Stripe key. Havard has said the test products are to be deleted and replaced
-- with real ones, so it is deactivated here rather than re-priced.
UPDATE products SET active = FALSE, updated_at = NOW() WHERE slug = 'eikebolle-hardanger';
