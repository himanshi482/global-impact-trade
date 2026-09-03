/**
 * lib/tradeRisk.js
 * Stage 3 Phase 3 — Deterministic Trade Risk Engine.
 *
 * Takes pre-fetched market metrics + opportunity score breakdown
 * (no extra DB calls) and computes a structured risk assessment.
 *
 * IMPORTANT: Pure function — no Math.random(), no fabricated data.
 * Same inputs always produce the same output.
 */

/**
 * @param {object} params
 * @param {string|null} params.hsCode
 * @param {string|null} params.originCountry
 * @param {string|null} params.targetCountry
 * @param {object} params.metrics  — from getMarketMetrics()
 * @param {object} params.scoreBreakdown — from calculateOpportunityScore().breakdown
 * @returns {{ score: number, level: 'LOW'|'MEDIUM'|'HIGH', factors: string[], recommendations: string[] }}
 */
export function computeTradeRisk({ hsCode, originCountry, targetCountry, metrics, scoreBreakdown }) {
  const factors = [];
  const recommendations = [];

  // ── 1. Market Data Availability Risk (0-30 pts = low risk, higher points = lower risk)
  // We invert: riskPoints accumulate when things look risky.
  let riskPoints = 0;

  // Buyer concentration risk
  if (!metrics || metrics.buyerCount === 0) {
    riskPoints += 30;
    factors.push('No verified buyer entities found for this trade corridor — unconfirmed demand.');
    recommendations.push('Conduct primary market research before committing to this corridor.');
  } else if (metrics.buyerCount <= 2) {
    riskPoints += 15;
    factors.push(`Only ${metrics.buyerCount} buyer entity/entities recorded — high buyer concentration.`);
    recommendations.push('Diversify buyer outreach to reduce reliance on a single counterparty.');
  } else {
    factors.push(`${metrics.buyerCount} buyer entities identified — demand signal confirmed.`);
  }

  // Shipment history risk
  if (!metrics || metrics.shipmentCount === 0) {
    riskPoints += 25;
    factors.push('Zero customs shipment records in database for this lane — uncharted freight history.');
    recommendations.push('Pilot a small LCL trial shipment to validate logistics and customs clearance time.');
  } else if (metrics.shipmentCount < 3) {
    riskPoints += 10;
    factors.push(`Thin shipment history (${metrics.shipmentCount} manifests) — limited freight intelligence.`);
    recommendations.push('Review available bills of lading carefully before negotiating freight contracts.');
  } else {
    factors.push(`Active shipment trail: ${metrics.shipmentCount} manifests on record.`);
  }

  // Supplier saturation risk
  if (metrics && metrics.supplierCount > 0) {
    const ratio = metrics.buyerCount > 0 ? metrics.supplierCount / metrics.buyerCount : metrics.supplierCount;
    if (ratio > 3) {
      riskPoints += 20;
      factors.push(`High supplier saturation (${metrics.supplierCount} suppliers vs ${metrics.buyerCount} buyers) — compressed margins.`);
      recommendations.push('Differentiate via certifications, quality packaging, or extended payment terms (LC).');
    } else if (ratio > 1.5) {
      riskPoints += 10;
      factors.push(`Moderate competition: ${metrics.supplierCount} suppliers active in this corridor.`);
      recommendations.push('Strengthen product positioning with country-of-origin certifications.');
    } else {
      factors.push('Healthy supplier-to-buyer ratio — competitive but not saturated.');
    }
  }

  // Data confidence risk
  const dataConfidence = scoreBreakdown?.dataConfidence ?? 0;
  if (dataConfidence < 25) {
    riskPoints += 15;
    factors.push('Very low data confidence — scores are based on sparse dataset coverage.');
    recommendations.push('Supplement platform data with third-party trade intelligence before committing capital.');
  } else if (dataConfidence < 50) {
    riskPoints += 8;
    factors.push('Limited data confidence — market metrics reflect available internal dataset only.');
    recommendations.push('Validate key buyers independently before large shipments.');
  } else {
    factors.push(`Data confidence: ${dataConfidence}% — reliable signal basis.`);
  }

  // Trade value risk (very low value = untested market)
  if (metrics && metrics.totalShipmentValue > 0 && metrics.totalShipmentValue < 10_000) {
    riskPoints += 5;
    factors.push('Total historical trade value is very low — market is nascent or niche.');
  }

  // ── 2. Normalise to 0–100 risk score
  // riskPoints range: 0 (no risk signals) to 90 (all worst cases)
  const MAX_RISK_POINTS = 90;
  const score = Math.min(100, Math.round((riskPoints / MAX_RISK_POINTS) * 100));

  // ── 3. Risk level bucket
  let level;
  if (score >= 60) {
    level = 'HIGH';
  } else if (score >= 30) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue with standard export due diligence procedures.');
  }

  return { score, level, factors, recommendations };
}
