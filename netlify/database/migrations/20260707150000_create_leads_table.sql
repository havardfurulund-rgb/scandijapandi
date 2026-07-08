-- Progressive email capture ("Private Circle") from the homepage.
--
-- A `leads` table already exists (created in 20260611120000_add_products_and_leads)
-- and is APPEND-ONLY: the submission-created function mirrors every Netlify Forms
-- submission into it, so the same email legitimately appears many times. Because of
-- that, a UNIQUE(email) constraint cannot be added to `leads` (existing rows already
-- contain duplicate emails, and future form mirrors would be rejected).
--
-- The progressive homepage capture instead gets its own table, keyed by a unique
-- email, which the /api/leads function upserts into (INSERT ... ON CONFLICT (email)
-- DO UPDATE). This keeps the two data flows cleanly separated.
CREATE TABLE IF NOT EXISTS circle_leads (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  segment       TEXT,        -- 'customer', 'maker', 'curator', 'pending'
  language      TEXT,        -- 'no', 'en', 'jp'
  ref_code      TEXT,        -- influencer/curator ref
  source        TEXT,        -- 'homepage_circle', 'product_page', etc.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- The UNIQUE(email) column constraint already provides the index the upsert's
-- ON CONFLICT (email) target needs; these cover the common lookup dimensions.
CREATE INDEX IF NOT EXISTS circle_leads_segment_idx ON circle_leads (segment);
CREATE INDEX IF NOT EXISTS circle_leads_ref_code_idx ON circle_leads (ref_code);
