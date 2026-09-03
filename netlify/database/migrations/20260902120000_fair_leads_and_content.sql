-- ============================================================================
-- 20260902120000_fair_leads_and_content.sql
-- Scandi Japandi Collection — CRM extensions, fair-sourced leads, content model
--
-- Sources: Oslo Design Fair (31.8–2.9.2026), Formex Stockholm (25–27.8.2026),
-- Habitare Helsinki (2–6.9.2026), Norway–Japan ecosystem research.
-- ALL leads below are "found online — verify before outreach". None are marked
-- verified. Notes carry the source so the curator can check the claim.
-- ============================================================================

-- ── 1. Extend producer_leads ──────────────────────────────────────────────────
ALTER TABLE producer_leads
  ADD COLUMN IF NOT EXISTS lead_type       TEXT DEFAULT 'producer',
  -- producer | organisation | destination | brand | importer
  ADD COLUMN IF NOT EXISTS source_event    TEXT,
  -- oslo_design_fair_2026 | formex_aug_2026 | habitare_2026 | tallinn_design_festival_2026 | ecosystem_research
  ADD COLUMN IF NOT EXISTS content_status  TEXT DEFAULT 'not_planned',
  -- not_planned | planned | scheduled | filmed | in_localisation | published
  ADD COLUMN IF NOT EXISTS stand_number    TEXT,
  ADD COLUMN IF NOT EXISTS agency_fit      TEXT;
  -- none | possible | strong  (candidate for retainer/agency services)

CREATE INDEX IF NOT EXISTS producer_leads_lead_type_idx    ON producer_leads (lead_type);
CREATE INDEX IF NOT EXISTS producer_leads_source_event_idx ON producer_leads (source_event);

-- ── 2. Content model: episodes + product links ───────────────────────────────
CREATE TABLE IF NOT EXISTS content_episodes (
  id                SERIAL PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title_no          TEXT NOT NULL,
  title_en          TEXT,
  title_jp          TEXT,
  format            TEXT DEFAULT 'atelier',
  -- atelier | object | material | live | season
  producer_lead_id  INTEGER REFERENCES producer_leads(id) ON DELETE SET NULL,
  producer_name     TEXT,
  location          TEXT,
  description_no    TEXT,
  description_en    TEXT,
  description_jp    TEXT,
  video_url_jp      TEXT,   -- JP dubbed/subtitled master (YouTube/Vimeo)
  video_url_en      TEXT,
  video_url_no      TEXT,
  short_url         TEXT,   -- Reel / Short
  thumbnail_url     TEXT,
  duration_seconds  INTEGER,
  status            TEXT DEFAULT 'planned',
  -- planned | filmed | in_localisation | qa | published | archived
  native_qa_done    BOOLEAN DEFAULT FALSE,
  filmed_at         DATE,
  published_at      TIMESTAMPTZ,
  co_host_influencer_id INTEGER,   -- influencer_crm.id for LIVE format
  views_jp          INTEGER DEFAULT 0,
  views_total       INTEGER DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS episode_products (
  episode_id   INTEGER NOT NULL REFERENCES content_episodes(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  sort_order   INTEGER DEFAULT 0,
  PRIMARY KEY (episode_id, product_slug)
);

CREATE INDEX IF NOT EXISTS content_episodes_status_idx ON content_episodes (status);

-- Episode attribution on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS episode_slug TEXT;
CREATE INDEX IF NOT EXISTS orders_episode_slug_idx ON orders (episode_slug);

-- ── 3. Fair-sourced leads ─────────────────────────────────────────────────────
-- Oslo Design Fair 2026 ------------------------------------------------------
INSERT INTO producer_leads
  (name, country, region, category, main_products, website, instagram,
   japandi_score, fits_japandi, japandi_notes, priority, status,
   outreach_channel, lead_type, source_event, agency_fit, next_action, notes, source)
VALUES
('UND', 'Norway', 'Bergen', 'Ceramics',
 'Ceramics (The Legacy, The Essentials), kitchen textiles, everyday objects', 'und.no', '@und.no',
 5, 'yes', '10-year Bergen brand. New "Snø" glaze inspired by fresh snow and coastal sea fog — a ready-made Japandi story. Already has production film.',
 1, 'prospect', 'email', 'brand', 'oslo_design_fair_2026', 'strong',
 'Meet at ODF stand today. Pitch: Atelier episode in Bergen + Japan content package (agency retainer candidate).',
 'Found via oslodesignfair.no article (Aug 2026) — verify before outreach. Launching Snø Sept 2026. Contact page und.no/pages/contact.', 'research'),

('Knapstad Glass', 'Norway', 'Norway', 'Glass',
 'Hand-blown glass objects, art vases, stemware', 'knapstadglass.no', '@knapstadglass',
 5, 'yes', 'Hand-blown Norwegian glass, small scale, Brand New newcomer. Ideal first Atelier episode — visual, tactile, one person.',
 1, 'prospect', 'instagram+email', 'producer', 'oslo_design_fair_2026', 'none',
 'Meet at ODF Brand New area today. Propose filming in the glass studio in October.',
 'Found via oslodesignfair.no Brand New article — verify before outreach.', 'research'),

('Rauma Ullvarefabrikk (Rauma Garn)', 'Norway', 'Rauma / Møre og Romsdal', 'Textiles',
 'Norwegian wool yarn, tradition since 1927', 'raumagarn.no', '@raumagarn',
 4, 'yes', 'Pure Norwegian wool story. Product is niche in Japan but the wool + place narrative is strong. Agency candidate.',
 2, 'prospect', 'email', 'brand', 'oslo_design_fair_2026', 'strong',
 'Pitch material-story episode ("Ull fra Rauma") + Japan distribution content.',
 'Found via oslodesignfair.no article — verify before outreach.', 'research'),

('Sandnes Garn', 'Norway', 'Sandnes', 'Textiles',
 'Norwegian wool yarn, knitwear collections', 'sandnesgarn.no', '@sandnesgarn',
 4, 'yes', 'Large Norwegian wool brand. Knitting culture is big in Japan. Agency candidate more than product partner.',
 2, 'prospect', 'email', 'brand', 'oslo_design_fair_2026', 'strong',
 'Pitch Japan content package.',
 'Found via oslodesignfair.no article — verify before outreach.', 'research'),

('Embla Design', 'Norway', 'Norway', 'Jewellery',
 'Handmade Norwegian jewellery', NULL, NULL,
 4, 'yes', 'Handmade, easy to ship, high margin. Story must be verified.',
 2, 'prospect', 'email+instagram', 'producer', 'oslo_design_fair_2026', 'none',
 'Verify website and maker story. Meet at ODF if possible.',
 'Found via oslodesignfair.no ("Håndlagde Norske smykker – Embla Design") — verify before outreach.', 'research'),

('Patti Oslo', 'Norway', 'Oslo', 'Other',
 'Handmade children''s products in natural materials, nostalgic minimalist', 'pattioslo.com', '@pattioslo',
 4, 'yes', 'Made to last and be inherited — a Japanese value. Warm minimalism.',
 2, 'prospect', 'instagram+email', 'producer', 'oslo_design_fair_2026', 'none',
 'Verify product range and price points.',
 'Found via oslodesignfair.no Brand New article — verify before outreach.', 'research'),

('P.A.P Sweden', 'Sweden', 'Sweden', 'Other',
 'Bags, wallets, laptop sleeves — locally produced, timeless', 'papsweden.se', '@pap_madeinsweden',
 4, 'yes', 'Swedish, local craft production, clean timeless design. Ships easily.',
 2, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Verify materials (leather? canvas?) and Japan fit.',
 'Found via oslodesignfair.no Brand New article — verify before outreach.', 'research'),

('mARTe Henriksen', 'Norway', 'Norway', 'Ceramics',
 'Ceramics and illustration, playful personal expression', 'marte-henriksen.com', NULL,
 3, 'partial', 'Personal, playful — may be too loud for core Japandi audience. Check.',
 3, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Review portfolio before contact.',
 'Found via oslodesignfair.no Brand New article — verify before outreach.', 'research'),

('Gry & Sif', 'Denmark', 'Denmark', 'Textiles',
 'Handmade felt and wool decorations', NULL, NULL,
 3, 'partial', 'Known Nordic craft brand, but possibly too "cosy" for Japandi. Check current collection.',
 3, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Review collection.',
 'Found via oslodesignfair.no article — verify before outreach.', 'research'),

('Jentene på tunet', 'Norway', 'Norway', 'Food & Pantry',
 'Award-winning Norwegian chocolate, gift boxes', 'jentenepaatunet.no', '@jentenepaatunet',
 3, 'partial', 'Japan loves premium chocolate. Export rules and shelf life must be checked. Circle-gift candidate.',
 3, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Check food export to Japan feasibility.',
 'Found via oslodesignfair.no Brand New article — verify before outreach.', 'research'),

('ITO Yarn', 'Japan', 'Japan', 'Textiles',
 'Japanese yarn with craft tradition — exhibiting IN Norway', 'ito-yarn.com', '@itoyarn',
 3, 'partial', 'NOT a supply lead. Japanese brand exhibiting at ODF — reverse direction. Valuable for market insight and possible co-marketing.',
 2, 'prospect', 'email', 'brand', 'oslo_design_fair_2026', 'possible',
 'Contact for knowledge exchange on Japan market and possible cross-promotion.',
 'Found via oslodesignfair.no Brand New article — verify before outreach.', 'research')
ON CONFLICT DO NOTHING;


-- Oslo Design Fair 2026 — additional leads from the full exhibitor list (92 entries, extracted 3 Sept 2026)
INSERT INTO producer_leads
  (name, country, region, category, main_products, website, stand_number,
   japandi_score, fits_japandi, japandi_notes, priority, status,
   outreach_channel, lead_type, source_event, agency_fit, next_action, notes, source)
VALUES
('Meditativeceramics (Mona Gundersen)', 'Norway', 'Norway', 'Ceramics',
 'Studio ceramics — 6 products listed at ODF', 'meditativeceramics.novaspektrum.no', 'D02-12',
 5, 'yes', 'Name alone is a Japandi thesis. Single maker, ceramics. Verify style and studio location.',
 1, 'prospect', 'instagram+email', 'producer', 'oslo_design_fair_2026', 'none',
 'Find real website/Instagram; propose Atelier episode.',
 'Found via ODF exhibitor list — verify before outreach. NOVA-hosted page did not load.', 'research'),

('Klippan Yllefabrik', 'Sweden', 'Klippan, Skåne', 'Textiles',
 'Wool and cotton blankets, family mill since 1879', 'klippanyllefabrik.se', 'D02-13',
 4, 'yes', 'Swedish wool mill, 140+ years, natural fibres, calm palette. Brand/agency candidate.',
 2, 'prospect', 'email', 'brand', 'oslo_design_fair_2026', 'strong',
 'Check Japan distribution; pitch mill episode + Japan content package.',
 'Found via ODF exhibitor list — verify before outreach.', 'research'),

('Lillelam', 'Norway', 'Norway', 'Textiles',
 'Merino wool baby and children''s clothing', 'lillelam.no', 'D02-03',
 4, 'yes', 'Norwegian merino, quiet colours, quality. Japan has strong premium baby market.',
 2, 'prospect', 'email', 'brand', 'oslo_design_fair_2026', 'possible',
 'Verify production origin and price points.',
 'Found via ODF exhibitor list — verify before outreach.', 'research'),

('Knit Norway', 'Norway', 'Norway', 'Textiles',
 'Norwegian knitwear', 'knitnorway.no', 'D01-32',
 3, 'partial', 'Verify whether handmade/limited or industrial.',
 3, 'prospect', 'email', 'brand', 'oslo_design_fair_2026', 'possible',
 'Verify.',
 'Found via ODF exhibitor list — verify before outreach.', 'research'),

('Viking of Norway', 'Norway', 'Norway', 'Textiles',
 'Norwegian yarn', 'viking-garn.no', 'D04-38',
 3, 'partial', 'Yarn brand; story over product. Agency candidate at most.',
 3, 'prospect', 'email', 'brand', 'oslo_design_fair_2026', 'possible',
 'Verify.',
 'Found via ODF exhibitor list — verify before outreach.', 'research'),

('Fjell Studios by Fjellanger', 'Norway', 'Norway', 'Mixed',
 'Unknown — verify', 'fjellstudios.no', 'D01-02',
 3, 'partial', 'Name suggests mountain/Norwegian identity. Unverified.',
 3, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Open fjellstudios.no and classify.',
 'Found via ODF exhibitor list — NOT yet reviewed.', 'research'),

('KAMOdesign', 'Norway', 'Norway', 'Mixed',
 'Unknown — verify', 'kamodesign.no', 'D03-01',
 3, 'partial', 'Unverified Norwegian design brand.',
 3, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Open kamodesign.no and classify.',
 'Found via ODF exhibitor list — NOT yet reviewed.', 'research'),

('Mauds Manufaktur', 'Norway', 'Norway', 'Mixed',
 'Unknown — "manufaktur" suggests small-batch making', 'maudsmanufaktur.no', 'D04-32',
 3, 'partial', 'Unverified.',
 3, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Open maudsmanufaktur.no and classify.',
 'Found via ODF exhibitor list — NOT yet reviewed.', 'research'),

('Sølvminen', 'Norway', 'Norway', 'Jewellery',
 'Silver jewellery (assumed from name)', NULL, 'D01-21',
 3, 'partial', 'Unverified. Silver ships easily; check if handmade.',
 3, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Find website.',
 'Found via ODF exhibitor list — NOT yet reviewed.', 'research'),

('Papirdesign', 'Norway', 'Norway', 'Other',
 'Paper products', 'papirdesign.no', 'D01-22',
 3, 'partial', 'Paper is a Japanese-affinity material; verify if craft or print retail.',
 3, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Verify.',
 'Found via ODF exhibitor list — NOT yet reviewed.', 'research'),

('Gustaf & Linnea (Gustafs Gotländska)', 'Sweden', 'Gotland', 'Mixed',
 'Gotland products — possibly sheepskin/wool', NULL, 'D05-12',
 3, 'partial', 'Gotland has a strong island-craft story. Verify product.',
 3, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Verify.',
 'Found via ODF exhibitor list — NOT yet reviewed.', 'research'),

('My Visible Mend (Eva Kittelsen)', 'Norway', 'Oslo / Romsås', 'Textiles',
 'Visible mending: sashiko, kintsugi kits, workshops — imports Japanese craft supplies to Norway', 'myvisiblemend.no', 'D05-30',
 3, 'partial', 'REVERSE DIRECTION: brings Japanese craft (sashiko, kintsugi) to Norway. Not a product partner for Japan, but a strong content story (Norway meets Japan) and a potential co-host for a Japan-facing episode on repair culture.',
 2, 'prospect', 'email', 'brand', 'oslo_design_fair_2026', 'possible',
 'Contact Eva Kittelsen for a content collaboration, not distribution. Shop opens Romsås 15.9.26.',
 'Reviewed myvisiblemend.no 3 Sept 2026. Founder Eva Kittelsen. Sells Sashi.co thread, Humade kintsugi kits.', 'research'),

('Sögne Home', 'Norway', 'Søgne', 'Homeware & Lighting',
 'Unknown — verify', NULL, 'D01-04',
 3, 'partial', 'Unverified.',
 3, 'prospect', 'email', 'producer', 'oslo_design_fair_2026', 'none',
 'Verify.',
 'Found via ODF exhibitor list — NOT yet reviewed.', 'research'),

('RE:Designed', 'Denmark', 'Denmark', 'Other',
 'Upcycled leather bags and accessories', 'redesignedproject.dk', 'D03-40',
 3, 'partial', 'Danish, sustainable, but fashion-adjacent. Secondary.',
 3, 'prospect', 'email', 'brand', 'oslo_design_fair_2026', 'none',
 'Review collection.',
 'Found via ODF exhibitor list — verify before outreach.', 'research')
ON CONFLICT DO NOTHING;

-- Formex Design Talents (Stockholm) ------------------------------------------
INSERT INTO producer_leads
  (name, country, region, category, main_products, website,
   japandi_score, fits_japandi, japandi_notes, priority, status,
   outreach_channel, lead_type, source_event, next_action, notes, source)
VALUES
('Schou Studio', 'Norway', 'Laksevåg / Bergen', 'Mixed',
 'Design objects (Formex Design Talents Jan 2026)', NULL,
 4, 'yes', 'Norwegian participant in Swedish talent programme. Product unknown — verify.',
 2, 'prospect', 'instagram+email', 'producer', 'formex_jan_2026',
 'Find portfolio via formex.se/design-talents.',
 'Found via Stockholmsmässan press release (Jan 2026) — verify before outreach.', 'research'),

('Vemod Keramik', 'Sweden', 'Sweden', 'Ceramics',
 'Studio ceramics', NULL,
 4, 'yes', 'Name ("vemod") resonates with mono no aware. Verify work.',
 2, 'prospect', 'instagram+email', 'producer', 'formex_aug_2024',
 'Find portfolio.',
 'Found via Formex Design Talents list — verify before outreach.', 'research'),

('Höganäs Drejeri', 'Sweden', 'Höganäs', 'Ceramics',
 'Thrown ceramics from Sweden''s ceramic capital', NULL,
 4, 'yes', 'Höganäs has deep ceramic tradition. Verify maker.',
 2, 'prospect', 'email', 'producer', 'formex_aug_2024',
 'Find website.',
 'Found via Formex Design Talents list — verify before outreach.', 'research'),

('Kansha (Sofia Alm)', 'Sweden', 'Sweden', 'Mixed',
 'Unknown — name means gratitude (感謝) in Japanese', NULL,
 4, 'partial', 'Japanese name suggests Japan-inspired practice. Investigate.',
 2, 'prospect', 'instagram+email', 'producer', 'formex_aug_2024',
 'Search Instagram for @kansha.',
 'Found via Formex Design Talents list — verify before outreach.', 'research'),

('Anna Krantz', 'Sweden', 'Torslanda', 'Textiles',
 'Textile products — Formex Design Talents Best in Show Jan 2026', NULL,
 3, 'partial', 'Award winner. Playful expression — check Japandi fit.',
 3, 'prospect', 'email', 'producer', 'formex_jan_2026',
 'Review Midsommarflaggstång product.',
 'Found via Stockholmsmässan press release — verify before outreach.', 'research')
ON CONFLICT DO NOTHING;

-- Habitare (Helsinki) ---------------------------------------------------------
INSERT INTO producer_leads
  (name, country, region, category, main_products, website,
   japandi_score, fits_japandi, japandi_notes, priority, status,
   outreach_channel, lead_type, source_event, agency_fit, next_action, notes, source)
VALUES
('Woodnotes', 'Finland', 'Finland', 'Textiles',
 'Paper yarn textiles, rugs, blinds', 'woodnotes.fi',
 5, 'yes', 'Paper yarn — almost Japanese in material logic. Established brand. Agency candidate.',
 1, 'prospect', 'email', 'brand', 'habitare_2026', 'strong',
 'Pitch Japan content package; check existing Japan distribution first.',
 'Found via Habitare 2026 coverage (COVER magazine) — verify before outreach.', 'research'),

('Finarte', 'Finland', 'Finland', 'Textiles',
 'Rugs — family-run since 1985, sustainable materials', 'finarte.fi',
 4, 'yes', 'Finnish rug design, family story, sustainability. Agency candidate.',
 2, 'prospect', 'email', 'brand', 'habitare_2026', 'strong',
 'Pitch Japan content package. Stand 6h50 at Habitare.',
 'Found via COVER magazine Habitare 2026 preview — verify before outreach.', 'research'),

('Secto Design', 'Finland', 'Finland', 'Homeware & Lighting',
 'Handmade birch lamps', 'sectodesign.fi',
 4, 'yes', 'Finnish birch, handmade. Likely already in Japan — check for content partnership rather than distribution.',
 2, 'prospect', 'email', 'brand', 'habitare_2026', 'possible',
 'Check Japan distributor status.',
 'Found via Helsinki Design Week coverage — verify before outreach.', 'research')
ON CONFLICT DO NOTHING;

-- Norway–Japan ecosystem: organisations, importers, destinations --------------
INSERT INTO producer_leads
  (name, country, region, category, main_products, website,
   japandi_score, fits_japandi, japandi_notes, priority, status,
   outreach_channel, lead_type, source_event, agency_fit, next_action, notes, source)
VALUES
('NCCJ / StyleNORWAY', 'Japan', 'Tokyo', 'Organisation',
 'Norwegian Chamber of Commerce in Japan; publishes StyleNORWAY (Japanese-language lifestyle magazine)', 'norwegianchamber.com',
 5, 'yes', 'Japanese-language editorial + importer network, no source-side video. We are the missing piece.',
 1, 'prospect', 'email', 'organisation', 'ecosystem_research', 'strong',
 'FIRST CONTACT. Propose: 1 episode/month for StyleNORWAY channels in exchange for network access.',
 'Found via norwegianchamber.com — verify current StyleNORWAY status before outreach.', 'research'),

('Norwegian Design Network (Japan)', 'Japan', 'Tokyo', 'Organisation',
 'Network of Japanese importers of Norwegian furniture and interior products; originated StyleNORWAY concept 2010', NULL,
 5, 'yes', 'Importers who already sell Norwegian design in Japan. Buyers of content.',
 1, 'prospect', 'agent', 'importer', 'ecosystem_research', 'strong',
 'Reach via NCCJ. Ask for member list.',
 'Found via opportunities-abroad.no article (2018) — verify the network still exists.', 'research'),

('Innovation Norway Tokyo', 'Japan', 'Tokyo', 'Organisation',
 'Norwegian government trade promotion; has run Norwegian design/fashion events in Japan', 'innovasjonnorge.no',
 4, 'yes', 'Legitimacy, events, possible funding (export support). Not a channel.',
 1, 'prospect', 'email', 'organisation', 'ecosystem_research', 'possible',
 'Request meeting; ask about export support schemes for content-led market entry.',
 'Found via norwegianchamber.com — verify current country director.', 'research'),

('Nordic Innovation House Tokyo', 'Japan', 'Tokyo', 'Organisation',
 'Joint Nordic trade-promotion hub for startups', NULL,
 3, 'partial', 'Network and possible venue for Tokyo-side Open Studio LIVE.',
 2, 'prospect', 'email', 'organisation', 'ecosystem_research', 'possible',
 'Introduce ScandiJapandi as Nordic media startup.',
 'Found via NCCJ blog (2020) — verify current status.', 'research'),

('Norwegian Icons Tokyo', 'Japan', 'Tokyo', 'Organisation',
 'Showroom promoting Norwegian design 1940–1975; Tokyo presence', NULL,
 4, 'yes', 'Physical Tokyo venue for Norwegian design. Pop-up / screening partner.',
 2, 'prospect', 'email', 'importer', 'ecosystem_research', 'possible',
 'Verify showroom still operates.',
 'Found via opportunities-abroad.no (2018) — verify before outreach.', 'research'),

('Fuglen Tokyo', 'Japan', 'Tokyo', 'Organisation',
 'Norwegian coffee/cocktail/vintage design brand with Tokyo venues', 'fuglen.com',
 4, 'yes', 'Norwegian brand with loyal Japanese audience. Pop-up and screening partner.',
 2, 'prospect', 'email', 'brand', 'ecosystem_research', 'possible',
 'Propose screening of first episode at Fuglen Tokyo.',
 'NCCJ corporate member — verify contact.', 'research'),

('Visit Norway / Fjord Norway (Japan)', 'Norway', 'Norway', 'Organisation',
 'Destination marketing toward Japanese travellers', 'visitnorway.com',
 4, 'yes', 'Destination episodes ("Hardanger: where wood becomes bowl") fit their Japan campaigns. Paying client candidate.',
 2, 'prospect', 'email', 'destination', 'ecosystem_research', 'strong',
 'Pitch place-based episode package after episode 1 exists.',
 'Research — verify Japan market contact at Innovation Norway/Visit Norway.', 'research'),

('Fiskars Japan', 'Japan', 'Tokyo', 'Organisation',
 'Nordic brand in Japan; co-hosts Nordic design seminars with the five Nordic chambers', NULL,
 3, 'partial', 'Established Nordic brand in Japan. Event partner rather than product partner.',
 3, 'prospect', 'agent', 'brand', 'ecosystem_research', 'possible',
 'Reach via NCCJ seminar programme.',
 'Found via norwegianchamber.com — verify.', 'research')
ON CONFLICT DO NOTHING;

-- Tallinn Design Festival (28.9–4.10.2026) — event itself as a lead
INSERT INTO producer_leads
  (name, country, region, category, main_products, website,
   japandi_score, fits_japandi, japandi_notes, priority, status,
   outreach_channel, lead_type, source_event, agency_fit, next_action, notes, source)
VALUES
('Tallinn Design Festival (Disainiöö)', 'Estonia', 'Tallinn', 'Organisation',
 'Largest Baltic design festival, 100+ brands, Design Street market', 'tallinndesignfestival.com',
 4, 'yes', 'Gateway to Baltic makers. Propose "Japan window": we film 3–5 exhibitors, they market it as exhibitor benefit.',
 2, 'prospect', 'email', 'organisation', 'tallinn_design_festival_2026', 'strong',
 'Contact organisers before 28 Sept. Curator to attend and film.',
 'Verified event dates via tallinndesignfestival.com. Organiser contact to be found.', 'research')
ON CONFLICT DO NOTHING;
