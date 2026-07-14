-- Press contacts list
CREATE TABLE IF NOT EXISTS press_contacts (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  outlet        TEXT,
  email         TEXT NOT NULL UNIQUE,
  country       TEXT,
  language      TEXT DEFAULT 'en',
  active        BOOLEAN DEFAULT TRUE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Press releases
CREATE TABLE IF NOT EXISTS press_releases (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  title_en      TEXT,
  title_jp      TEXT,
  body_no       TEXT,
  body_en       TEXT,
  body_jp       TEXT,
  status        TEXT DEFAULT 'draft',  -- draft, sent
  sent_at       TIMESTAMPTZ,
  recipients    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Newsletter campaigns
CREATE TABLE IF NOT EXISTS newsletters (
  id            SERIAL PRIMARY KEY,
  subject_no    TEXT,
  subject_en    TEXT,
  subject_jp    TEXT,
  body_no       TEXT,
  body_en       TEXT,
  body_jp       TEXT,
  segment       TEXT DEFAULT 'all',  -- all, customer, maker, curator
  status        TEXT DEFAULT 'draft',  -- draft, sent
  sent_at       TIMESTAMPTZ,
  recipients    INTEGER DEFAULT 0,
  resend_broadcast_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencer/curator tracking
CREATE TABLE IF NOT EXISTS influencers (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  handle        TEXT,
  platform      TEXT,  -- instagram, line, youtube, blog
  email         TEXT,
  ref_code      TEXT UNIQUE,
  country       TEXT DEFAULT 'JP',
  language      TEXT DEFAULT 'ja',
  status        TEXT DEFAULT 'prospect',  -- prospect, active, paused
  notes         TEXT,
  commission_pct INTEGER DEFAULT 10,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Producer weekly report log
CREATE TABLE IF NOT EXISTS producer_reports (
  id            SERIAL PRIMARY KEY,
  producer_email TEXT NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  orders_count  INTEGER DEFAULT 0,
  revenue_nok   INTEGER DEFAULT 0,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS influencers_ref_code_idx ON influencers (ref_code);
CREATE INDEX IF NOT EXISTS newsletters_status_idx ON newsletters (status);
