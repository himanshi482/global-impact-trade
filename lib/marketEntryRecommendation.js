/**
 * lib/marketEntryRecommendation.js
 * Stage 3 Phase 3 — Strategic Market Entry Recommendation Engine.
 *
 * Produces a clear strategic market entry verdict:
 * - ENTER_NOW
 * - ENTER_WITH_CAUTION
 * - RESEARCH_MORE
 * - AVOID
 *
 * Also provides concrete reasons, advantages, risks, and required actions.
 * Pure deterministic rule engine.
 */

/**
 * Computes strategic market entry recommendation.
 *
 * @param {object} params
 * @param {string|null} params.targetCountry
 * @param {number} params.opportunityScore - 0 to 100
 * @param {object} params.riskAssessment - { score, level, factors }
 * @param {object} params.readinessAssessment - { score, level, blockers }
 * @param {object} [params.landedCost] - { available, marginPercentage }
 * @param {object} [params.metrics] - { buyerCount, shipmentCount, totalShipmentValue }
 * @returns {{
 *   decision: 'ENTER_NOW'|'ENTER_WITH_CAUTION'|'RESEARCH_MORE'|'AVOID',
 *   recommendedCountry: string,
 *   reasons: string[],
 *   advantages: string[],
 *   risks: string[],
 *   requiredActions: string[]
 * }}
 */
export function generateMarketEntryRecommendation({
  targetCountry,
  opportunityScore = 0,
  riskAssessment = {},
  readinessAssessment = {},
  landedCost = null,
  metrics = {},
}) {
  const country = targetCountry || "Target Market";
  const reasons = [];
  const advantages = [];
  const risks = [];
  const requiredActions = [];

  const oppScore = Number(opportunityScore) || 0;
  const riskScore = Number(riskAssessment.score) || 50;
  const readinessScore = Number(readinessAssessment.score) || 50;
  const readinessLevel = readinessAssessment.level || "MODERATE";
  const riskLevel = riskAssessment.level || "MEDIUM";
  const blockers = readinessAssessment.blockers || [];
  const buyerCount = metrics.buyerCount || 0;
  const shipmentCount = metrics.shipmentCount || 0;

  // Compile advantages
  if (oppScore >= 70) {
    advantages.push(`Strong composite Market Opportunity Score (${oppScore}/100)`);
  }
  if (buyerCount >= 3) {
    advantages.push(`Active buyer ecosystem with ${buyerCount} identified purchasing entities`);
  } else if (buyerCount > 0) {
    advantages.push(`${buyerCount} direct importer lead(s) cataloged`);
  }
  if (shipmentCount >= 3) {
    advantages.push(`Established freight lane with ${shipmentCount} verified customs manifests`);
  }
  if (landedCost?.available && landedCost.marginPercentage > 15) {
    advantages.push(`Healthy projected export margin: ${landedCost.marginPercentage}%`);
  }

  // Compile risks
  if (riskLevel === "HIGH") {
    risks.push(`High trade corridor risk score (${riskScore}/100)`);
  } else if (riskLevel === "MEDIUM") {
    risks.push(`Moderate trade risk (${riskScore}/100) requires proactive terms`);
  }
  if (buyerCount === 0) {
    risks.push("Zero verified foreign buyers in database for this corridor");
  }
  if (landedCost && !landedCost.available) {
    risks.push("Official tariff duty rates not documented in database; unexpected customs duties possible");
  }
  if (landedCost?.available && landedCost.marginPercentage !== null && landedCost.marginPercentage <= 0) {
    risks.push(`Negative or zero estimated profit margin (${landedCost.marginPercentage}%)`);
  }
  if (blockers.length > 0) {
    blockers.forEach((b) => risks.push(b));
  }

  // Decision logic (strictly deterministic)
  let decision;

  // Case A: Negative margin or multiple severe blockers -> AVOID
  if (
    (landedCost?.available && landedCost.marginPercentage !== null && landedCost.marginPercentage < 0) ||
    (riskScore >= 80 && oppScore < 25)
  ) {
    decision = "AVOID";
    reasons.push("Economic or structural unfeasibility identified under current cost parameters.");
    if (landedCost?.marginPercentage < 0) {
      reasons.push(`Estimated landed cost exceeds selling price resulting in negative margin (${landedCost.marginPercentage}%).`);
    }
    requiredActions.push("Renegotiate procurement unit cost or domestic freight rates to achieve profitability.");
    requiredActions.push("Explore alternative target markets with lower tariff barriers or higher average transaction values.");
  }
  // Case B: High opportunity, manageable risk, ready status -> ENTER_NOW
  else if (oppScore >= 70 && riskLevel === "LOW" && readinessLevel === "READY") {
    decision = "ENTER_NOW";
    reasons.push("Strong commercial demand verified with established customs shipment velocity.");
    reasons.push("Favorable trade risk profile with complete commodity classification.");
    requiredActions.push("Initiate direct outreach to top cataloged buyers with FOB/CIF quotation.");
    requiredActions.push("Request ocean container bookings for initial commercial batch.");
  }
  // Case C: Good opportunity or readiness, but requires caution -> ENTER_WITH_CAUTION
  else if (
    (oppScore >= 50 && riskLevel !== "HIGH") ||
    (readinessLevel === "READY" && riskLevel === "MEDIUM") ||
    (readinessLevel === "MODERATE" && oppScore >= 55)
  ) {
    decision = "ENTER_WITH_CAUTION";
    reasons.push("Commercial viability confirmed with verified market signals.");
    if (riskLevel === "MEDIUM") {
      reasons.push("Moderate corridor risk indicates need for secured payment terms.");
    }
    if (landedCost && !landedCost.available) {
      reasons.push("Tariff schedule not confirmed in repository; local duty rates must be re-verified.");
    }
    requiredActions.push("Secure 100% Irrevocable Letter of Credit (LC at sight) or 30% advance deposit.");
    requiredActions.push("Initiate trial pilot order (LCL or air cargo) before committing full container volume.");
    requiredActions.push("Obtain binding tariff classification advice from target destination customs authorities.");
  }
  // Case D: Low confidence, low data, or unconfirmed buyers -> RESEARCH_MORE
  else {
    decision = "RESEARCH_MORE";
    reasons.push("Insufficient transactional or buyer intelligence to justify immediate capital deployment.");
    if (buyerCount === 0) {
      reasons.push("No direct buyer demand established in this specific corridor.");
    }
    if (shipmentCount === 0) {
      reasons.push("Zero verified customs manifest history for this route.");
    }
    requiredActions.push("Conduct secondary trade desk investigation via commercial attachés or EPCs (Export Promotion Councils).");
    requiredActions.push("Participate in relevant overseas trade exhibitions or digital B2B buyer matchmaking delegations.");
    requiredActions.push("Evaluate adjacent transit markets or regional re-export hubs.");
  }

  return {
    decision,
    recommendedCountry: country,
    reasons,
    advantages,
    risks,
    requiredActions,
  };
}
