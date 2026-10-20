-- Campaign images (Håvard 20.10.2026): model photography generated with OpenArt
-- from the real studio cutouts as references. The model shot becomes the main
-- image; the studio cutout of the actual piece stays in the gallery so the
-- customer still sees the real object. Scarf uses variant B (Håvard's pick).
UPDATE products SET image_url='/launch/campaign/sweater-a-4x5.jpg',  gallery_urls='["/launch/products/dyra-5475-4x5.jpg","/launch/campaign/sweater-b-4x5.jpg"]'::jsonb,  updated_at=NOW() WHERE slug='dyra-yoke-sweater-nordic-pattern';
UPDATE products SET image_url='/launch/campaign/cardigan-a-4x5.jpg', gallery_urls='["/launch/products/dyra-5476-4x5.jpg","/launch/campaign/cardigan-b-4x5.jpg"]'::jsonb, updated_at=NOW() WHERE slug='dyra-natural-brown-cardigan';
UPDATE products SET image_url='/launch/campaign/scarf-b-4x5.jpg',    gallery_urls='["/launch/products/dyra-5479-4x5.jpg","/launch/campaign/scarf-a-4x5.jpg"]'::jsonb,    updated_at=NOW() WHERE slug='dyra-lace-scarf-undyed-cream';
UPDATE products SET image_url='/launch/campaign/bag-a-4x5.jpg',      gallery_urls='["/launch/products/dyra-5477-4x5.jpg","/launch/campaign/bag-b-4x5.jpg"]'::jsonb,      updated_at=NOW() WHERE slug='dyra-alpaca-motif-knitted-bag';
UPDATE products SET image_url='/launch/campaign/beanie-a-4x5.jpg',   gallery_urls='["/launch/products/dyra-5465-4x5.jpg","/launch/campaign/beanie-b-4x5.jpg"]'::jsonb,   updated_at=NOW() WHERE slug='dyra-ribbed-beanie-natural-brown';
UPDATE products SET image_url='/launch/campaign/socks-a-4x5.jpg',    gallery_urls='["/launch/products/dyra-5469-4x5.jpg","/launch/campaign/socks-b-4x5.jpg"]'::jsonb,    updated_at=NOW() WHERE slug='dyra-farm-socks-heather-grey';
UPDATE products SET image_url='/launch/campaign/shirt-a-4x5.jpg',    gallery_urls='["/launch/campaign/shirt-b-4x5.jpg","/launch/skredderen/skredderen-shirt-4x5.jpg"]'::jsonb,    updated_at=NOW() WHERE slug='skredderen-bespoke-shirt';
UPDATE products SET image_url='/launch/campaign/trousers-a-4x5.jpg', gallery_urls='["/launch/campaign/trousers-b-4x5.jpg","/launch/skredderen/skredderen-trousers-4x5.jpg"]'::jsonb, updated_at=NOW() WHERE slug='skredderen-bespoke-trousers';
UPDATE products SET image_url='/launch/campaign/jacket-b-4x5.jpg',   gallery_urls='["/launch/campaign/jacket-a-4x5.jpg","/launch/skredderen/skredderen-jacket-4x5.jpg"]'::jsonb,   updated_at=NOW() WHERE slug='skredderen-bespoke-jacket';
