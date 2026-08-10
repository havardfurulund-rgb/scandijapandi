-- Set the Japanese yen price on the launch collection.
--
-- `price_jpy` was added alongside the other story/translation fields in
-- 20260707120000 but never populated, so every product row still had NULL. The
-- product detail page renders the yen price conditionally
-- (src/pages/products/[slug].astro), which means the JPY line was simply hidden
-- on all three products until now — Japanese visitors only ever saw the NOK
-- price. These values make it visible for the first time.
--
-- NOK prices are left untouched: price_nok remains the currency the checkout
-- function charges in, and price_jpy is display-only.
UPDATE products
   SET price_jpy  = 13000,
       updated_at = NOW()
 WHERE slug = 'eikebolle-hardanger';

UPDATE products
   SET price_jpy  = 32000,
       updated_at = NOW()
 WHERE slug = 'handvevd-linndekke-lofoten';

UPDATE products
   SET price_jpy  = 19000,
       updated_at = NOW()
 WHERE slug = 'minimalistisk-keramikkvase';
