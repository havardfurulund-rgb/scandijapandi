-- Skredderen fra Damaskus: replace the brand-mark placeholder with linen
-- garment photography (Håvard 20.10.2026). The listings stay made-to-measure
-- (enquiry only); the images illustrate the linen work, not a specific garment.
UPDATE products SET image_url = '/launch/skredderen/skredderen-shirt-4x5.jpg',      gallery_urls = '["/launch/skredderen/skredderen-alteration-4x5.jpg"]'::jsonb, updated_at = NOW() WHERE slug = 'skredderen-bespoke-shirt';
UPDATE products SET image_url = '/launch/skredderen/skredderen-trousers-4x5.jpg',   gallery_urls = '["/launch/skredderen/skredderen-jacket-4x5.jpg"]'::jsonb,     updated_at = NOW() WHERE slug = 'skredderen-bespoke-trousers';
UPDATE products SET image_url = '/launch/skredderen/skredderen-jacket-4x5.jpg',     gallery_urls = '["/launch/skredderen/skredderen-trousers-4x5.jpg"]'::jsonb,   updated_at = NOW() WHERE slug = 'skredderen-bespoke-jacket';
UPDATE products SET image_url = '/launch/skredderen/skredderen-alteration-4x5.jpg', gallery_urls = '["/launch/skredderen/skredderen-shirt-4x5.jpg"]'::jsonb,      updated_at = NOW() WHERE slug = 'skredderen-alteration-recut';
