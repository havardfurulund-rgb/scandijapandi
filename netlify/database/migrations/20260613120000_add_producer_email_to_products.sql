-- Automatic order handling needs a destination address for every product: when
-- a customer completes a Stripe checkout, the storefront emails the relevant
-- producer that a new order has arrived. The producer's display name already
-- lives in `producer`; this adds the machine-routable contact address used by
-- the stripe-webhook function. Nullable here so the column can be added without
-- touching existing rows — the admin UI enforces it as required for new and
-- edited products going forward.
ALTER TABLE products ADD COLUMN IF NOT EXISTS producer_email TEXT;
