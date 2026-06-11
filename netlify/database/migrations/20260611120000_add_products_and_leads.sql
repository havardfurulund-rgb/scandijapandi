-- Products are the storefront's source of truth, managed from the branded
-- /admin page. Prices are stored in whole Norwegian kroner (NOK). The checkout
-- function looks products up by `slug` to build a Stripe Checkout Session.
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  producer    TEXT,
  description TEXT,
  price_nok   INTEGER NOT NULL,
  image_url   TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Leads capture the data the company treats as a core asset: visitors leaving
-- their interests (Scandinavian design, food culture, travel) and producers /
-- designers who want to reach the Japanese market. Submissions arrive through
-- Netlify Forms and are mirrored here by the submission-created function so the
-- data is queryable and segmentable.
CREATE TABLE IF NOT EXISTS leads (
  id              SERIAL PRIMARY KEY,
  form_name       TEXT,
  persona         TEXT,
  name            TEXT,
  email           TEXT,
  company         TEXT,
  website         TEXT,
  interests       JSONB,
  market_interest TEXT,
  message         TEXT,
  raw             JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email);
CREATE INDEX IF NOT EXISTS leads_form_name_idx ON leads (form_name);

-- Seed the storefront with the launch collection so the site is never empty,
-- even before anything is added through the admin.
INSERT INTO products (slug, name, producer, description, price_nok, image_url, active) VALUES
  ('handvevd-linndekke-lofoten', 'Håndvevd Linndekke fra Lofoten', 'Lofoten Vev', 'Håndvevd lindekke i naturfarger, vevd etter tradisjon på Lofoten.', 2450, 'https://picsum.photos/id/1015/800/1000', TRUE),
  ('eikebolle-hardanger', 'Eikebolle Hardanger', 'Hardanger Treverk', 'Dreid eikebolle fra Hardanger, oljet for daglig bruk.', 980, 'https://picsum.photos/id/201/800/1000', TRUE),
  ('minimalistisk-keramikkvase', 'Minimalistisk Keramikkvase', 'Sōen Keramikk', 'Håndlaget steingodsvase med matt glasur i japandi-stil.', 1450, 'https://picsum.photos/id/870/800/1000', TRUE)
ON CONFLICT (slug) DO NOTHING;
