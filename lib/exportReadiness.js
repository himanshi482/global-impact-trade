/**
 * lib/exportReadiness.js
 * Stage 3 Phase 3 — Export Readiness Assessment Engine.
 *
 * Evaluates readiness across 8 key structural dimensions:
 * 1. Product & HS Code availability
 * 2. Supplier availability
 * 3. Buyer availability
 * 4. Market demand
 * 5. Trade activity
 * 6. Data confidence
 * 7. Risk mitigation
 * 8. Cost & landed margin efficiency
 *
 * IMPORTANT: Pure deterministic calculation — no Math.random().
 */

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Calculates deterministic Export Readiness Score (0–100) with blockers and recommendations.
 *
 * @param {object} params
 * @param {string|null} params.hsCode
 * @param {string|null} params.product
 * @param {object} params.metrics - from getMarketMetrics()
 * @param {object} params.opportunityScore - from calculateOpportunityScore()
 * @param {object} params.riskAssessment - from computeTradeRisk()
 * @param {object} [params.landedCost] - from calculateLandedCost()
 * @returns {{ score: number, level: 'READY'|'MODERATE'|'NOT_READY', blockers: string[], recommendations: string[], breakdown: object }}
 */
export function computeExportReadiness({
  hsCode,
  product,
  metrics,
  opportunityScore,
  riskAssessment,
  landedCost,
}) {
  const blockers = [];
  const recommendations = [];

  let hsScore = 0;
  let buyerScore = 0;
  let supplierScore = 0;
  let demandScore = 0;
  let tradeActivityScore = 0;
  let confidenceScore = 0;
  let riskSafetyScore = 0;
  let costEfficiencyScore = 0;

  // 1. HS Code / Product validation (15 pts)
  if (hsCode && String(hsCode).trim().length >= 4) {
    hsScore = 15;
  } else if (product && String(product).trim().length > 0) {
    hsScore = 8;
    blockers.push("Exact 6-digit HS Code not specified. Classification required for binding customs assessment.");
  } else {
    hsScore = 0;
    blockers.push("Missing commodity classification (HS Code and Product Name).");
  }

  // 2. Buyer availability (15 pts)
  const buyerCount = metrics?.buyerCount || 0;
  const verifiedBuyers = metrics?.verifiedBuyerCount || 0;
  if (buyerCount >= 3) {
    buyerScore = 15;
  } else if (buyerCount > 0) {
    buyerScore = 10;
    if (verifiedBuyers === 0) {
      recommendations.push("Direct buyer interest found, but no verified badges. Request credit reports prior to contract.");
    }
  } else {
    buyerScore = 0;
    blockers.push("No identified foreign buyers in target country corridor.");
  }

  // 3. Supplier availability (10 pts)
  const supplierCount = metrics?.supplierCount || 0;
  if (supplierCount > 0) {
    supplierScore = 10;
  } else {
    supplierScore = 5; // Neutral: exporter might be the sole manufacturer
    recommendations.push("Establish domestic supply chain agreements or confirm manufacturing capacity.");
  }

  // 4. Market Demand (15 pts)
  const oppBreakdown = opportunityScore?.breakdown || {};
  const buyerDemandPts = oppBreakdown.buyerDemand || 0; // 0-30
  demandScore = Math.round((buyerDemandPts / 30) * 15);

  // 5. Trade Activity (15 pts)
  const shipmentCount = metrics?.shipmentCount || 0;
  if (shipmentCount >= 5) {
    tradeActivityScore = 15;
  } else if (shipmentCount > 0) {
    tradeActivityScore = 10;
  } else {
    tradeActivityScore = 2;
    recommendations.push("No historical bills of lading for this exact lane. Verify carrier container booking availability.");
  }

  // 6. Data Confidence (10 pts)
  const dataConfidence = oppBreakdown.dataConfidence || 0; // 0-100
  confidenceScore = Math.round((dataConfidence / 100) * 10);
  if (confidenceScore < 5) {
    recommendations.push("Dataset coverage is exploratory. Validate local regulatory requirements independently.");
  }

  // 7. Risk Safety Score (10 pts)
  const riskScore = riskAssessment?.score || 50; // 0-100 (high = bad)
  riskSafetyScore = Math.max(0, Math.round((1 - riskScore / 100) * 10));
  if (riskScore >= 60) {
    blockers.push(`Elevated trade risk score (${riskScore}/100) requires formal risk mitigation.`);
  }

  // 8. Cost Efficiency & Margin Feasibility (10 pts)
  if (landedCost) {
    if (landedCost.available) {
      if (landedCost.estimatedMargin !== null && landedCost.marginPercentage !== null) {
        if (landedCost.marginPercentage >= 20) {
          costEfficiencyScore = 10;
        } else if (landedCost.marginPercentage > 0) {
          costEfficiencyScore = 6;
          recommendations.push(`Tight projected margin (${landedCost.marginPercentage}%). Negotiate bulk freight discounts.`);
        } else {
          costEfficiencyScore = 1;
          blockers.push(`Negative estimated margin (${landedCost.marginPercentage}%). Landed cost exceeds target selling price.`);
        }
      } else {
        costEfficiencyScore = 7; // Tariff known and landed cost calculated, no target price
      }
    } else {
      costEfficiencyScore = 4;
      recommendations.push("Official tariff duty rates not in database. Obtain customs clearance quote from local freight forwarder.");
    }
  } else {
    costEfficiencyScore = 5;
  }

  const rawScore =
    hsScore +
    buyerScore +
    supplierScore +
    demandScore +
    tradeActivityScore +
    confidenceScore +
    riskSafetyScore +
    costEfficiencyScore;

  const score = clamp(rawScore, 0, 100);

  let level;
  if (score >= 70 && blockers.length === 0) {
    level = "READY";
  } else if (score >= 45) {
    level = "MODERATE";
  } else {
    level = "NOT_READY";
  }

  if (recommendations.length === 0) {
    recommendations.push("Export fundamentals are sound. Proceed to buyer outreach and proforma invoice issuance.");
  }

  return {
    score,
    level,
    blockers,
    recommendations,
    breakdown: {
      hsClassification: hsScore,
      buyerAvailability: buyerScore,
      supplierAvailability: supplierScore,
      marketDemand: demandScore,
      tradeActivity: tradeActivityScore,
      dataConfidence: confidenceScore,
      riskMitigation: riskSafetyScore,
      costEfficiency: costEfficiencyScore,
    },
  };
}
