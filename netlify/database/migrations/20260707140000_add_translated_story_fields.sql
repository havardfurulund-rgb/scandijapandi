ALTER TABLE products
  ADD COLUMN IF NOT EXISTS origin_story_en        TEXT,
  ADD COLUMN IF NOT EXISTS origin_story_jp        TEXT,
  ADD COLUMN IF NOT EXISTS producer_story_en      TEXT,
  ADD COLUMN IF NOT EXISTS producer_story_jp      TEXT,
  ADD COLUMN IF NOT EXISTS material_en            TEXT,
  ADD COLUMN IF NOT EXISTS material_jp            TEXT,
  ADD COLUMN IF NOT EXISTS care_instructions_en   TEXT,
  ADD COLUMN IF NOT EXISTS care_instructions_jp   TEXT;
