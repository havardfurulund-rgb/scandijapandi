ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stripe_link        TEXT,
  ADD COLUMN IF NOT EXISTS stock_quantity     INTEGER,
  ADD COLUMN IF NOT EXISTS weight_grams       INTEGER,
  ADD COLUMN IF NOT EXISTS country_of_origin  TEXT;
