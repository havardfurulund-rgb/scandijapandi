// JPY display pricing for the Japan launch.
//
// The storefront shows JPY first and NOK second. A product can carry an
// explicit `price_jpy` (set in the admin or a migration); when it doesn't, the
// yen figure is derived from `price_nok` with a fixed rate and rounded to a
// Japanese price point (…800), e.g. 2 450 NOK → ¥40,800.
//
// Rate: JPY_PER_NOK env var (Netlify), default 16.6 (spot 13 Oct 2026).
// price_nok stays the amount Stripe charges; price_jpy is display only.

export const DEFAULT_JPY_PER_NOK = 16.6;

export function jpyRate(): number {
  const raw = typeof Netlify !== "undefined" ? Netlify.env.get("JPY_PER_NOK") : undefined;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_JPY_PER_NOK;
}

/** Round to the nearest Japanese price point ending in …800. */
export function toJapanesePricePoint(jpy: number): number {
  if (jpy < 1000) return Math.max(100, Math.round(jpy / 100) * 100);
  const thousands = Math.round(jpy / 1000) * 1000;
  return thousands - 200;
}

export function displayJpy(priceNok: number, explicitJpy?: number | null): number {
  if (explicitJpy && explicitJpy > 0) return Math.round(explicitJpy);
  return toJapanesePricePoint(priceNok * jpyRate());
}
