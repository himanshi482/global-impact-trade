/**
 * lib/exportDecisionEngine.js
 * Stage 3 Phase 3 — Unified Export Decision Engine.
 *
 * Orchestrates all trade intelligence pillars into a single comprehensive,
 * deterministic export decision assessment:
 * - Market Metrics & Opportunity Score
 * - Buyer Demand & Quality Scoring
 * - Supplier Competition Score
 * - Deterministic Trade Risk Assessment
 * - Tariff & Landed Cost Economics
 * - Export Readiness Score
 * - Strategic Market Entry Recommendation
 * - Recommended Buyers with Contact Masking
 * - Adaptive 10-Step Export Action Plan
 *
 * IMPORTANT: Pure deterministic math — absolutely zero Math.random().
 * All HS codes strictly preserved as strings (e.g. "010121").
 */

import { getMarketMetrics, getShipmentTrends } from "./marketIntelligence";
import { calculateOpportunityScore } from "./marketOpportunity";
import { computeTradeRisk } from "./tradeRisk";
import { calculateLandedCost } from "./landedCost";
import { computeExportReadiness } from "./exportReadiness";
import { generateMarketEntryRecommendation } from "./marketEntryRecommendation";
import { getRecommendedBuyers } from "./buyerMarketMatching";
import { generateExportActionPlan } from "./exportActionPlan";

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Runs the complete export decision engine.
 *
 * @param {object} params
 * @param {string|null} params.hsCode - Commodity HS code string
 * @param {string|null} params.product - Product description
 * @param {string|null} params.originCountry - Exporter home country
 * @param {string|null} params.targetCountry - Destination market
 * @param {number} [params.price=0] - Unit price
 * @param {number} [params.quantity=1] - Export volume
 * @param {number} [params.shipping=0] - Total shipping freight
 * @param {number} [params.insurance=0] - Total cargo insurance
 * @param {number} [params.otherCosts=0] - Other handling fees
 * @param {number|null} [params.targetSellingPrice=null] - Optional destination target price
 * @param {number|null} [params.userId=null]
 * @param {string} [params.userRole='USER']
 * @returns {Promise<object>} Complete unified Export Opportunity Analysis
 */
export async function evaluateExportOpportunity({
  hsCode,
  product = "",
  originCountry = "India",
  targetCountry = "",
  price = 0,
  quantity = 1,
  shipping = 0,
  insurance = 0,
  otherCosts = 0,
  targetSellingPrice = null,
  userId = null,
  userRole = "USER",
}) {
  const cleanHs = hsCode ? String(hsCode).trim() : "";
  const cleanProduct = product ? String(product).trim() : "";
  const cleanOrigin = originCountry ? String(originCountry).trim() : "India";
  const cleanTarget = targetCountry ? String(targetCountry).trim() : "";
  const isAdmin = userRole === "ADMIN";

  // 1. Fetch Market Metrics & Historical Shipment Trends
  const [metrics, trendResult] = await Promise.all([
    getMarketMetrics({
      hsCode: cleanHs || null,
      country: cleanTarget || null,
      direction: "export",
    }),
    getShipmentTrends({
      hsCode: cleanHs || null,
      country: cleanTarget || null,
      direction: "export",
    }),
  ]);

  // 2. Compute Market Opportunity Score
  const opportunityScore = calculateOpportunityScore({
    buyerCount: metrics.buyerCount,
    verifiedBuyerCount: metrics.verifiedBuyerCount,
    supplierCount: metrics.supplierCount,
    shipmentCount: metrics.shipmentCount,
    totalShipmentValue: metrics.totalShipmentValue,
    averageShipmentValue: metrics.averageShipmentValue,
    historicalYears: trendResult?.trends?.length || 1,
  });

  // 3. Compute Deterministic Trade Risk
  const riskAssessment = computeTradeRisk({
    hsCode: cleanHs,
    originCountry: cleanOrigin,
    targetCountry: cleanTarget,
    metrics,
    scoreBreakdown: opportunityScore.breakdown,
  });

  // 4. Compute Tariff & Landed Cost Economics
  const landedCost = await calculateLandedCost({
    hsCode: cleanHs,
    price,
    quantity,
    shipping,
    insurance,
    otherCosts,
    targetSellingPrice,
    targetCountry: cleanTarget,
  });

  // 5. Compute Export Readiness Score
  const readinessAssessment = computeExportReadiness({
    hsCode: cleanHs,
    product: cleanProduct,
    metrics,
    opportunityScore,
    riskAssessment,
    landedCost,
  });

  // 6. Generate Strategic Market Entry Recommendation
  const recommendation = generateMarketEntryRecommendation({
    targetCountry: cleanTarget,
    opportunityScore: opportunityScore.overall,
    riskAssessment,
    readinessAssessment,
    landedCost,
    metrics,
  });

  // 7. Buyer-to-Market Matching (with contact masking)
  const recommendedBuyers = await getRecommendedBuyers({
    hsCode: cleanHs || null,
    product: cleanProduct || null,
    targetCountry: cleanTarget || null,
    userId,
    isAdmin,
    limit: 6,
  });

  // 8. Generate Adaptive 10-Step Export Action Plan
  const actionPlan = generateExportActionPlan({
    hsCode: cleanHs,
    product: cleanProduct,
    originCountry: cleanOrigin,
    targetCountry: cleanTarget,
    opportunityScore,
    riskAssessment,
    readinessAssessment,
    landedCost,
    recommendedBuyers,
  });

  // 9. Compute Deterministic Component Sub-Scores:
  // A. Market Opportunity Score (0-100)
  const marketOpportunityScore = opportunityScore.overall;

  // B. Buyer Demand Score (0-100)
  const buyerDemandScore = Math.min(100, Math.round((opportunityScore.breakdown.buyerDemand / 30) * 100));

  // C. Competition Score (0-100) — higher means favorable/less saturated
  const competitionScore = Math.min(100, Math.round((opportunityScore.breakdown.supplierCompetition / 20) * 100));

  // D. Buyer Quality Score (0-100) — based on verified buyer ratio & volume
  let buyerQualityScore = 0;
  if (metrics.buyerCount > 0) {
    const verifiedRatio = metrics.verifiedBuyerCount / metrics.buyerCount;
    buyerQualityScore = Math.round(50 + verifiedRatio * 50);
  }

  // E. Trade Risk Score (0-100) — lower is safer
  const tradeRiskScore = riskAssessment.score;

  // F. Cost Efficiency Score (0-100)
  let costEfficiencyScore = 50;
  if (landedCost.available) {
    if (landedCost.marginPercentage !== null) {
      costEfficiencyScore = clamp(Math.round(50 + landedCost.marginPercentage), 0, 100);
    } else {
      costEfficiencyScore = 75; // tariff confirmed and landed cost quantified
    }
  } else {
    costEfficiencyScore = 40; // unverified tariff schedule
  }

  // G. Export Readiness Score (0-100)
  const exportReadinessScore = readinessAssessment.score;

  // 10. Final Composite Export Opportunity Score (0-100)
  // Transparent, normalized weighting:
  // Market Opportunity: 30%
  // Export Readiness: 25%
  // Safety (100 - Trade Risk): 20%
  // Buyer Demand & Quality: 15%
  // Cost Efficiency: 10%
  const safetyScore = 100 - tradeRiskScore;
  const demandQuality = Math.round((buyerDemandScore + buyerQualityScore) / 2);

  const compositeScore = Math.round(
    marketOpportunityScore * 0.30 +
    exportReadinessScore * 0.25 +
    safetyScore * 0.20 +
    demandQuality * 0.15 +
    costEfficiencyScore * 0.10
  );

  const finalOpportunityScore = clamp(compositeScore, 0, 100);

  return {
    inputs: {
      hsCode: cleanHs,
      product: cleanProduct,
      originCountry: cleanOrigin,
      targetCountry: cleanTarget,
      price: Number(price) || 0,
      quantity: Number(quantity) || 1,
      shipping: Number(shipping) || 0,
      insurance: Number(insurance) || 0,
      otherCosts: Number(otherCosts) || 0,
      targetSellingPrice: targetSellingPrice ? Number(targetSellingPrice) : null,
    },
    scores: {
      finalOpportunityScore,
      marketOpportunityScore,
      buyerDemandScore,
      competitionScore,
      buyerQualityScore,
      tradeRiskScore,
      costEfficiencyScore,
      exportReadinessScore,
    },
    opportunityBreakdown: opportunityScore,
    riskAssessment,
    landedCost,
    readinessAssessment,
    recommendation,
    recommendedBuyers,
    actionPlan,
    marketMetrics: metrics,
    historicalTrends: trendResult,
    analyzedAt: new Date().toISOString(),
  };
}
