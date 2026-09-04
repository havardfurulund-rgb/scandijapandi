-- 北の手 / Kita no Te — phase 2: subtitle flag, maker release agreements

ALTER TABLE content_episodes ADD COLUMN IF NOT EXISTS srt_translated BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS maker_releases (
  id              SERIAL PRIMARY KEY,
  maker_name      TEXT NOT NULL,
  company         TEXT,
  email           TEXT NOT NULL,
  shoot_date      DATE,
  shoot_place     TEXT,
  language        TEXT DEFAULT 'no',
  signature_text  TEXT NOT NULL,
  agreed          BOOLEAN NOT NULL DEFAULT TRUE,
  ip              TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS maker_releases_email_idx ON maker_releases (email);
