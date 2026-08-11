-- Influencer CRM - professional influencer and media management
CREATE TABLE IF NOT EXISTS influencer_crm (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  handle_instagram TEXT,
  handle_tiktok TEXT,
  handle_youtube TEXT,
  handle_line TEXT,
  handle_blog TEXT,
  email TEXT,
  manager_email TEXT,
  manager_name TEXT,
  language TEXT DEFAULT 'ja',
  country TEXT DEFAULT 'JP',
  city TEXT,
  followers_instagram INTEGER,
  followers_tiktok INTEGER,
  followers_youtube INTEGER,
  engagement_rate NUMERIC(5,2),
  avg_reach_per_post INTEGER,
  audience_age_range TEXT,
  audience_gender TEXT,
  audience_countries TEXT,
  tier TEXT DEFAULT 'micro',
  category TEXT,
  japandi_fit_score INTEGER DEFAULT 3 CHECK (japandi_fit_score BETWEEN 1 AND 5),
  japandi_fit_notes TEXT,
  brand_fit TEXT DEFAULT 'good',
  status TEXT DEFAULT 'prospect',
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  ref_code TEXT UNIQUE,
  commission_pct INTEGER DEFAULT 10,
  payment_method TEXT,
  last_contacted_at DATE,
  last_contact_channel TEXT,
  products_sent TEXT,
  posts_published INTEGER DEFAULT 0,
  post_links TEXT,
  total_clicks INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue_nok INTEGER DEFAULT 0,
  commission_earned INTEGER DEFAULT 0,
  last_sale_at DATE,
  next_action TEXT,
  next_action_date DATE,
  notes TEXT,
  ai_summary TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
  );

CREATE INDEX IF NOT EXISTS influencer_crm_status_idx ON influencer_crm (status);
CREATE INDEX IF NOT EXISTS influencer_crm_country_idx ON influencer_crm (country);
CREATE INDEX IF NOT EXISTS influencer_crm_ref_code_idx ON influencer_crm (ref_code);

-- Seed with 5 candidates identified via online research (Japan market plus one global reference account).
-- None of these have been contacted yet. Notes below flag what still needs manual verification
-- before any outreach -- several entries explicitly note missing or unverified data.
INSERT INTO influencer_crm (
  name, handle_instagram, country, city, language,
  followers_instagram, tier, category,
  japandi_fit_score, japandi_fit_notes, brand_fit,
  status, priority, commission_pct,
  next_action, notes, ai_summary, source
  ) VALUES (
  'KOZLIFE Tokyo',
  '@kozlife_tokyo',
  'JP', 'Tokyo', 'ja',
  64000, 'macro', 'interior',
  5, 'Japan distributor for Nordic brands incl Ferm Living, Cooee Design, Paper Collective. Direct overlap with ScandiJapandi positioning.',
  'perfect',
  'prospect', 1, 10,
  'Research contact method via kozlife.jp website. Consider partnership rather than standard influencer deal.',
  'NOT a personal influencer -- this is a Nordic design shop/brand in Tokyo with 64K followers and 10K posts. Approach as distribution or media partner, not typical influencer. Japan distributor for Ferm Living and several Nordic brands. High authority in Nordic design space in Japan.',
  'KOZLIFE is a Tokyo-based Nordic interior and lifestyle online shop. Japan distributor for Ferm Living, Cooee Design, Paper Collective and others. 64K Instagram followers, extremely relevant audience.',
  'research'
  ), (
  'Saki & Jens (@jaspandii)',
  '@jaspandii',
  'JP', 'Tokyo', 'ja',
  12000, 'micro', 'lifestyle',
  5, 'Japanese woman married to Danish man, blogs about Nordic lifestyle and interior design in Japanese. Highly authentic Japandi voice.',
  'perfect',
  'prospect', 1, 10,
  'Send Instagram DM in Japanese. Mention specific posts about Nordic interior. Offer free product.',
  'Bio references creating hygge-style spaces even in an older rented apartment. 30s, international couple Japan/Denmark. Blogs in Japanese about Nordic lifestyle. 12K followers but very engaged niche audience. Lives Tokyo/Kanagawa area.',
  'Japanese woman in international marriage with Danish partner. Creates Japanese-language content about Nordic lifestyle and Japandi interior design. Micro-influencer with highly targeted, authentic audience of Japanese women interested in Nordic aesthetics.',
  'research'
  ), (
  'Japandi Style Selection JP',
  '@japandi_interior.jp',
  'JP', 'Japan', 'ja',
  NULL, 'micro', 'interior',
  4, 'Japan-based Japandi account. Needs follower count verification.',
  'good',
  'prospect', 2, 10,
  'Visit @japandi_interior.jp on Instagram to verify follower count and content quality before outreach.',
  'Found via Instagram search. Japan-based Japandi content account. Follower count and contact details need verification before outreach.',
  'Japanese Japandi interior inspiration account. Content and audience need verification.',
  'research'
  ), (
  'Laila Rietbergen - Japandi Interior',
  '@japandi.interior',
  'NL', 'Netherlands', 'en',
  619000, 'mega', 'interior',
  5, 'Author of 3 Japandi books, 619K followers globally. Not Japanese but massive reach with Japan-interested audience worldwide.',
  'perfect',
  'prospect', 2, 10,
  'Approach via email or Instagram DM. Position as exclusive Nordic craft partner for her audience. May prefer gifting over commission.',
  'Dutch influencer, author of 3 Japandi coffee table books. 619K followers. Not Japanese market specifically but huge global Japandi audience including Japan followers. Could drive significant international traffic. Premium partnership approach recommended.',
  'Laila Rietbergen is a leading Japandi lifestyle influencer globally with a large international following. Author of multiple Japandi books. Dutch-based but with a significant global Japandi audience. High-value partnership candidate.',
  'research'
  ), (
  'Teruaki Hayashi',
  '@7days_1mile',
  'JP', 'Japan', 'ja',
  291000, 'macro', 'interior',
  4, 'Identified as a fast-growing Japanese home and interior creator on Instagram in 2025 per influencer-tracking data. 291K+ followers.',
  'good',
  'prospect', 2, 10,
  'Research content style on Instagram before outreach. Verify Japandi/craft alignment.',
  'Identified via influencer-tracking data as a fast-growing Japanese home and interior Instagram creator in 2025. 291K followers. Content style and Japandi alignment needs verification.',
  'Fast-growing Japanese interior design Instagram creator. Rapid growth suggests algorithmic momentum. High reach for Japan interior audience. Content verification needed before outreach.',
  'research'
  ) ON CONFLICT DO NOTHING;
