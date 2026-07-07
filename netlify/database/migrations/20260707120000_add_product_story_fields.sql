-- Add producer story and product detail fields to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS producer_story    TEXT,
  ADD COLUMN IF NOT EXISTS producer_location TEXT,
  ADD COLUMN IF NOT EXISTS producer_image_url TEXT,
  ADD COLUMN IF NOT EXISTS material          TEXT,
  ADD COLUMN IF NOT EXISTS dimensions        TEXT,
  ADD COLUMN IF NOT EXISTS care_instructions TEXT,
  ADD COLUMN IF NOT EXISTS origin_story      TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls      JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS price_jpy         INTEGER,
  ADD COLUMN IF NOT EXISTS name_en           TEXT,
  ADD COLUMN IF NOT EXISTS name_jp           TEXT,
  ADD COLUMN IF NOT EXISTS description_en    TEXT,
  ADD COLUMN IF NOT EXISTS description_jp    TEXT;

-- Index for fast slug lookup on product pages
CREATE INDEX IF NOT EXISTS products_slug_idx ON products (slug);
