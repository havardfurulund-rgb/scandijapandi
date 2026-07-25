-- Replace the launch seed's picsum.photos stand-ins with a brand-aligned
-- "BILDE KOMMER" placeholder.
--
-- The storefront grid on the front page is rendered from /api/products (the
-- database), not from src/data/products.json — that JSON is only the static
-- fallback shown before the fetch resolves. Updating the JSON alone therefore
-- leaves real visitors looking at random picsum photography, so the seeded rows
-- have to be corrected here too.
--
-- Scoped to rows that still point at picsum, so any image a curator has since
-- uploaded through /admin is left untouched. Safe to re-run.
UPDATE products
   SET image_url  = '/images/placeholder-product.svg',
       updated_at = NOW()
 WHERE image_url LIKE '%picsum.photos%';

-- Same treatment for the producer portrait field, in case a seed or an early
-- test row used picsum there as well.
UPDATE products
   SET producer_image_url = NULL,
       updated_at         = NOW()
 WHERE producer_image_url LIKE '%picsum.photos%';
