/**
 * lib/leadScoring.js
 * Stage 3 Phase 2 — deterministic lead scoring engine.
 *
 * IMPORTANT: This is pure, deterministic math over data already
 * fetched from MySQL. No randomness, no fabricated data. The same
 * input object always produces the same score + reasons.
 *
 * Expected shape of `entity` (buyer or supplier row, already joined
 * with any shipment aggregates you compute in the discover queries):
 *
 * {
 *   shipmentCount: number,        // total known shipments
 *   totalShipmentValue: number,   // sum of shipment value (USD)
 *   verified: boolean,
 *   productMatch: boolean,        // true if entity's product/HS matches the search context
 *   countryMatch: boolean,        // true if entity's country matches the search context
 *   lastShipmentDate: string|Date|null, // ISO date or Date, null if unknown
 * }
 *
 * `context` carries the caller's search intent (optional):
 * {
 *   asOfDate: Date // defaults to now; pass explicitly in tests for determinism
 * }
 */

const MAX_SHIPMENT_ACTIVITY_POINTS = 30;
const MAX_TRADE_VALUE_POINTS = 20;
const MAX_PRODUCT_MATCH_POINTS = 20;
const MAX_COUNTRY_MATCH_POINTS = 10;
const MAX_VERIFICATION_POINTS = 10;
const MAX_RECENCY_POINTS = 10;

// Thresholds are intentionally simple, explainable, and stable.
// Tune only with real data distributions — never to inflate scores.
const SHIPMENT_COUNT_CAP = 50; // shipments count needed to hit max activity points
const TRADE_VALUE_CAP_USD = 1_000_000; // trade value needed to hit max value points
const RECENCY_FULL_DAYS = 90; // shipment within this window = full recency points
const RECENCY_ZERO_DAYS = 730; // shipment older than this = zero recency points

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreShipmentActivity(shipmentCount) {
  const count = Number(shipmentCount) || 0;
  const ratio = clamp(count / SHIPMENT_COUNT_CAP, 0, 1);
  return Math.round(ratio * MAX_SHIPMENT_ACTIVITY_POINTS);
}

function scoreTradeValue(totalShipmentValue) {
  const value = Number(totalShipmentValue) || 0;
  const ratio = clamp(value / TRADE_VALUE_CAP_USD, 0, 1);
  return Math.round(ratio * MAX_TRADE_VALUE_POINTS);
}

function scoreProductMatch(productMatch) {
  return productMatch ? MAX_PRODUCT_MATCH_POINTS : 0;
}

function scoreCountryMatch(countryMatch) {
  return countryMatch ? MAX_COUNTRY_MATCH_POINTS : 0;
}

function scoreVerification(verified) {
  return verified ? MAX_VERIFICATION_POINTS : 0;
}

function scoreRecency(lastShipmentDate, asOfDate) {
  if (!lastShipmentDate) return 0;
  const last = new Date(lastShipmentDate);
  if (Number.isNaN(last.getTime())) return 0;

  const now = asOfDate instanceof Date ? asOfDate : new Date();
  const daysSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince <= RECENCY_FULL_DAYS) return MAX_RECENCY_POINTS;
  if (daysSince >= RECENCY_ZERO_DAYS) return 0;

  // Linear decay between the full-credit window and the zero window.
  const ratio =
    1 - (daysSince - RECENCY_FULL_DAYS) / (RECENCY_ZERO_DAYS - RECENCY_FULL_DAYS);
  return Math.round(clamp(ratio, 0, 1) * MAX_RECENCY_POINTS);
}

function potentialLabel(score) {
  if (score >= 80) return 'HIGH POTENTIAL';
  if (score >= 50) return 'MEDIUM POTENTIAL';
  return 'LOW POTENTIAL';
}

/**
 * Compute a deterministic 0-100 lead score plus human-readable reasons.
 */
function computeLeadScore(entity, context = {}) {
  const asOfDate = context.asOfDate instanceof Date ? context.asOfDate : new Date();

  const breakdown = {
    shipmentActivity: scoreShipmentActivity(entity.shipmentCount),
    tradeValue: scoreTradeValue(entity.totalShipmentValue),
    productMatch: scoreProductMatch(entity.productMatch),
    countryMatch: scoreCountryMatch(entity.countryMatch),
    verification: scoreVerification(entity.verified),
    recency: scoreRecency(entity.lastShipmentDate, asOfDate),
  };

  const score = clamp(
    breakdown.shipmentActivity +
      breakdown.tradeValue +
      breakdown.productMatch +
      breakdown.countryMatch +
      breakdown.verification +
      breakdown.recency,
    0,
    100
  );

  const reasons = [];
  if (breakdown.shipmentActivity >= MAX_SHIPMENT_ACTIVITY_POINTS * 0.6) {
    reasons.push('Strong shipment activity');
  } else if (breakdown.shipmentActivity > 0) {
    reasons.push('Some shipment activity on record');
  }
  if (breakdown.tradeValue >= MAX_TRADE_VALUE_POINTS * 0.6) {
    reasons.push('High historical trade value');
  } else if (breakdown.tradeValue > 0) {
    reasons.push('Moderate historical trade value');
  }
  if (breakdown.productMatch > 0) {
    reasons.push('Product matches selected HS code');
  }
  if (breakdown.countryMatch > 0) {
    reasons.push('Country matches your target market');
  }
  if (breakdown.verification > 0) {
    reasons.push('Verified company');
  }
  if (breakdown.recency >= MAX_RECENCY_POINTS * 0.6) {
    reasons.push('Recent shipment activity');
  } else if (breakdown.recency === 0 && entity.lastShipmentDate) {
    reasons.push('No recent shipment activity');
  }

  return {
    score,
    potential: potentialLabel(score),
    breakdown,
    reasons,
  };
}

module.exports = {
  computeLeadScore,
  potentialLabel,
  // exported for unit testing determinism
  scoreShipmentActivity,
  scoreTradeValue,
  scoreProductMatch,
  scoreCountryMatch,
  scoreVerification,
  scoreRecency,
};
