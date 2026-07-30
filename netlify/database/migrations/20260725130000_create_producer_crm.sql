-- Producer CRM — tracks potential and active producer partners
CREATE TABLE IF NOT EXISTS producer_leads (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  country         TEXT,
  region          TEXT,
  category        TEXT,
  main_products   TEXT,
  website         TEXT,
  instagram       TEXT,
  contact_email   TEXT,
  contact_name    TEXT,
  japandi_score   INTEGER DEFAULT 3 CHECK (japandi_score BETWEEN 1 AND 5),
  japandi_notes   TEXT,
  priority        INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  status          TEXT DEFAULT 'prospect',
  -- prospect → contacted → replied → meeting → agreement_sent → active → declined
  last_contacted  DATE,
  next_action     TEXT,
  next_action_date DATE,
  notes           TEXT,
  outreach_channel TEXT,  -- email, instagram, agent, phone
  ai_summary      TEXT,   -- AI-generated analysis
  fits_japandi    TEXT,   -- yes / partial / no
  source          TEXT DEFAULT 'manual',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS producer_leads_status_idx ON producer_leads (status);
CREATE INDEX IF NOT EXISTS producer_leads_priority_idx ON producer_leads (priority);
CREATE INDEX IF NOT EXISTS producer_leads_country_idx ON producer_leads (country);

-- Seed with the 28 leads from the initial research list
INSERT INTO producer_leads (name, country, region, category, main_products, website, japandi_score, priority, status, fits_japandi, outreach_channel, notes) VALUES
('Hardanger Treverk', 'Norway', 'Hardanger / Vestland', 'Furniture & Wood', 'Handcrafted oak tables, bowls, cutting boards', 'hardangertreverk.no', 5, 1, 'prospect', 'yes', 'email+instagram', 'Pure Scandinavian craftsmanship, natural materials, small scale'),
('Lofoten Vev', 'Norway', 'Lofoten / Nordland', 'Textiles', 'Wool blankets, throws, handwoven textiles', 'lofotenvev.no', 5, 1, 'prospect', 'yes', 'email', 'Arctic light + natural fibers = strong Japandi story'),
('Sōen Keramikk', 'Norway', 'Oslo / Eastern Norway', 'Ceramics', 'Minimalist ceramic vases, tableware', 'soenkeramikk.no', 5, 1, 'prospect', 'yes', 'instagram+email', 'Name already has Japanese resonance'),
('Laagen Flow', 'Norway', 'Buskerud / Eastern Norway', 'Clothing & Textiles', 'Wool sweaters, linen hoodies, natural fiber clothing', 'laagenflow.no', 5, 1, 'active', 'yes', 'email', 'Already in admin examples, high potential'),
('Skagerak Denmark', 'Denmark', 'Denmark', 'Furniture & Outdoor', 'Outdoor furniture, teak accessories', 'skagerak.dk', 4, 1, 'prospect', 'yes', 'email', 'Premium but approachable for collection'),
('Audo Copenhagen', 'Denmark', 'Copenhagen', 'Furniture & Homeware', 'Lighting, tables, accessories', 'audocph.com', 4, 1, 'prospect', 'partial', 'agent', 'Select pieces only, approach via agent'),
('Ferm Living', 'Denmark', 'Copenhagen', 'Homeware & Textiles', 'Ceramics, textiles, small furniture', 'fermliving.com', 4, 1, 'prospect', 'yes', 'email', 'Larger brand – approach for exclusive collection'),
('Normann Copenhagen', 'Denmark', 'Copenhagen', 'Furniture & Accessories', 'Chairs, tables, accessories', 'normann-copenhagen.com', 3, 1, 'prospect', 'partial', 'email', 'Select quiet pieces only'),
('Iittala', 'Finland', 'Helsinki', 'Glass & Ceramics', 'Glassware, ceramics', 'iittala.com', 4, 1, 'prospect', 'yes', 'pr', 'Focus on limited editions'),
('Marimekko', 'Finland', 'Helsinki', 'Textiles & Fashion', 'Fabrics, home textiles', 'marimekko.com', 3, 1, 'prospect', 'partial', 'agent', 'Avoid loud patterns; seek calm collaborations'),
('Tactile Baltics', 'Latvia', 'Baltic region', 'Collective', 'Collectible design objects', 'tactilebaltics.com', 5, 1, 'prospect', 'yes', 'instagram+email', 'Excellent entry point to multiple Baltic makers'),
('Laima Ceramics', 'Latvia', 'Rundāle / Latgale', 'Ceramics', 'Ceramic tableware, art ceramics', 'laimaceramics.lv', 5, 1, 'prospect', 'yes', 'email+instagram', 'Unique Baltic firing techniques, story-rich'),
('Ceramika Artystyczna', 'Poland', 'Bolesławiec', 'Ceramics', 'Stoneware, modern interpretations', 'ceramikaartystyczna.com', 3, 1, 'prospect', 'partial', 'email', 'Avoid heavy traditional patterns; seek modern minimal lines'),
('Tartaruga Studio', 'Poland', 'Łódź', 'Textiles', 'Handwoven kilims, wool rugs, wall hangings', 'tartarugastudio.pl', 5, 1, 'prospect', 'yes', 'email', 'Strong story + quality wool'),
('Malwina Konopacka', 'Poland', 'Warsaw', 'Ceramics', 'Sculptural ceramic vessels', 'malwinakonopacka.com', 5, 1, 'prospect', 'yes', 'email', 'Collectible ceramics with personality'),
('Norwegian Wool producers', 'Norway', 'Various', 'Textiles', 'Blankets, throws, yarn', NULL, 4, 2, 'prospect', 'yes', 'email', 'Focus on pure Norwegian wool stories'),
('Hadeland Glassblowers', 'Norway', 'Oppland', 'Glass', 'Hand-blown glass objects', NULL, 4, 2, 'prospect', 'yes', 'instagram', 'Quiet luxury glass'),
('Swedish independent ceramicists', 'Sweden', 'Various', 'Ceramics', 'Studio ceramics', 'svenskform.se', 4, 2, 'prospect', 'yes', 'email', 'Via Svensk Form'),
('Bornholm ceramic studios', 'Denmark', 'Bornholm', 'Ceramics', 'Studio pottery', NULL, 5, 2, 'prospect', 'yes', 'instagram+email', 'Strong ceramic tradition'),
('Nikari', 'Finland', 'Various', 'Furniture & Wood', 'Solid wood furniture', 'nikari.fi', 5, 2, 'prospect', 'yes', 'email', 'High craftsmanship'),
('Estonian Design House makers', 'Estonia', 'Tallinn', 'Furniture & Textiles', 'Wood objects, linen, wool', NULL, 4, 2, 'prospect', 'yes', 'email', 'Via Estonian Design House'),
('Latvian design studios', 'Latvia', 'Riga', 'Mixed', 'Furniture, textiles, objects', NULL, 4, 2, 'prospect', 'yes', 'email', 'Via LIAA or Tactile Baltics'),
('Lithuanian design makers', 'Lithuania', 'Vilnius / Kaunas', 'Mixed', 'Furniture, ceramics, textiles', NULL, 4, 2, 'prospect', 'yes', 'email', 'Via Lithuanian Design Forum'),
('Polish furniture makers', 'Poland', 'Pomerania / Gdańsk', 'Furniture', 'Modern wood furniture', NULL, 3, 2, 'prospect', 'partial', 'email', 'Seek quiet, natural material focus'),
('Icelandic wool & ceramics', 'Iceland', 'Reykjavik', 'Textiles & Ceramics', 'Wool products, lava-inspired ceramics', NULL, 5, 2, 'prospect', 'yes', 'email', 'Unique Nordic story'),
('Larger Scandinavian brands', 'Nordic', 'Various', 'Mixed', 'Select limited editions', NULL, 2, 3, 'prospect', 'partial', 'agent', 'Only if exclusive collaboration possible'),
('Bolesławiec traditional producers', 'Poland', 'Bolesławiec', 'Ceramics', 'Stoneware', NULL, 2, 3, 'prospect', 'partial', 'email', 'Only quiet modern designs'),
('Sami craft producers', 'Norway', 'Sápmi', 'Textiles & Leather', 'Traditional craft', NULL, 3, 3, 'prospect', 'partial', 'cultural_org', 'Respectful approach needed, via cultural organisations')
ON CONFLICT DO NOTHING;
