// Deterministic Rule-Based Strategic Recommendations Engine for GlobeBridge

/**
 * Generates actionable trade recommendations based strictly on aggregated metrics and scores.
 * 
 * @param {Object} params
 * @param {number} params.overallScore - 0 to 100 Opportunity Score
 * @param {number} params.buyerCount - Total buyer count
 * @param {number} params.verifiedBuyerCount - Count of verified buyers
 * @param {number} params.supplierCount - Total supplier count
 * @param {number} params.shipmentCount - Total shipment count
 * @param {number} params.totalShipmentValue - Cumulative trade value
 * @param {string|null} [params.hsCode] - Target HS code
 * @param {string|null} [params.country] - Target country
 * @returns {Array<{ type: 'action'|'caution'|'strategy', title: string, description: string }>}
 */
export function generateMarketRecommendations({
  overallScore = 0,
  buyerCount = 0,
  verifiedBuyerCount = 0,
  supplierCount = 0,
  shipmentCount = 0,
  totalShipmentValue = 0,
  hsCode = null,
  country = null,
}) {
  const recommendations = [];

  // Case 1: Insufficient / No data in this corridor
  if (buyerCount === 0 && shipmentCount === 0) {
    recommendations.push({
      type: "caution",
      title: "Exploratory Corridor Validation",
      description: `Insufficient direct trade data recorded for ${country || "this country"}. We recommend commissioning custom sample freight audits or exploring adjacent regional trading hubs.`,
    });
    recommendations.push({
      type: "strategy",
      title: "Verify Tariff & Compliance Feasibility",
      description: `Before committing inventory, review import duty rates (BCD/IGST) and statutory non-tariff barriers for HS Code ${hsCode || "selected product"}.`,
    });
    return recommendations;
  }

  // Case 2: High Buyer Demand
  if (buyerCount >= 3) {
    recommendations.push({
      type: "action",
      title: "Direct Buyer Outreach & RFQ Engagement",
      description: `Strong buyer activity with ${buyerCount} identified purchasing entities (${verifiedBuyerCount} verified). Initiate outreach using the Trade Data directory unlock system.`,
    });
  } else if (buyerCount > 0) {
    recommendations.push({
      type: "action",
      title: "Targeted Prospective Engagement",
      description: `Identified ${buyerCount} buyer lead(s)${verifiedBuyerCount > 0 ? ` (${verifiedBuyerCount} verified)` : ""}. Conduct tailored pitch presentations with FOB/CIF quotes and international quality certifications.`,
    });
  }

  // Case 3: Shipment Volume & Freight Logistics
  if (shipmentCount >= 2 && totalShipmentValue > 100_000) {
    recommendations.push({
      type: "strategy",
      title: "Consolidated Container Logistics",
      description: `Proven shipment volume indicates active commercial container lanes. Negotiate volume ocean freight rates (FCL) to optimize landed cost competitiveness.`,
    });
  } else if (shipmentCount > 0) {
    recommendations.push({
      type: "strategy",
      title: "LCL Trial Shipments",
      description: `Established manifest trail exists. Consider starting with Less-than-Container Load (LCL) shipments to build buyer trust and test customs clearance turnaround.`,
    });
  }

  // Case 4: Supplier Competition
  if (supplierCount > buyerCount && supplierCount >= 3) {
    recommendations.push({
      type: "caution",
      title: "Product Differentiation & Certification",
      description: `Supplier presence is high relative to recorded buyers. Differentiate through international certifications (ISO, GMP, GOTS, CE), specialized packaging, or credit terms (LC).`,
    });
  } else if (supplierCount === 0 && buyerCount > 0) {
    recommendations.push({
      type: "action",
      title: "First-Mover Supply Opportunity",
      description: `Active buyer interest exists with minimal competing domestic suppliers in database. Seize initial market share with competitive lead times.`,
    });
  }

  // Case 5: Overall Score Tier Strategy
  if (overallScore >= 75) {
    recommendations.push({
      type: "strategy",
      title: "Priority Market Expansion",
      description: `Composite Market Opportunity Score of ${overallScore}/100 places this corridor in the top tier. Prioritize marketing allocation and dedicated sales resources.`,
    });
  } else if (overallScore < 50 && (buyerCount > 0 || shipmentCount > 0)) {
    recommendations.push({
      type: "caution",
      title: "Risk-Managed Market Entry",
      description: `Moderate opportunity score (${overallScore}/100). Secure advance payment terms (Letter of Credit / Bank Guarantee) and monitor buyer creditworthiness before large shipments.`,
    });
  }

  return recommendations;
}
