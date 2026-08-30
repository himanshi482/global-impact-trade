// Deterministic Market Opportunity Scoring Engine for GlobeBridge
// Translates real database trade metrics into a transparent, normalized 0–100 score.

/**
 * Calculates deterministic opportunity score based on actual aggregated trade metrics.
 * 
 * @param {Object} params
 * @param {number} params.buyerCount - Total buyer entities matching criteria
 * @param {number} params.verifiedBuyerCount - Count of verified buyers
 * @param {number} params.supplierCount - Total supplier entities
 * @param {number} params.shipmentCount - Total recorded shipments
 * @param {number} params.totalShipmentValue - Cumulative USD trade value
 * @param {number} params.averageShipmentValue - Mean USD value per manifest
 * @param {number} [params.historicalYears=1] - Span of historical shipment records
 * @returns {{
 *   overall: number,
 *   tier: string,
 *   breakdown: {
 *     buyerDemand: number,
 *     shipmentActivity: number,
 *     buyerAvailability: number,
 *     supplierCompetition: number,
 *     dataConfidence: number
 *   },
 *   explanation: {
 *     positiveFactors: string[],
 *     warnings: string[]
 *   }
 * }}
 */
export function calculateOpportunityScore({
  buyerCount = 0,
  verifiedBuyerCount = 0,
  supplierCount = 0,
  shipmentCount = 0,
  totalShipmentValue = 0,
  averageShipmentValue = 0,
  historicalYears = 1,
}) {
  const positiveFactors = [];
  const warnings = [];

  // 1. Buyer Demand Score (0 - 30 points)
  let buyerDemand = 0;
  if (buyerCount > 0) {
    // 1 buyer = 10 pts, 3 buyers = 20 pts, 5+ buyers = 30 pts
    buyerDemand = Math.min(30, Math.round(buyerCount * 6));
    if (buyerDemand >= 20) {
      positiveFactors.push(`High international buyer presence (${buyerCount} active buyer entities in database)`);
    } else {
      positiveFactors.push(`Identified ${buyerCount} direct foreign buyer lead(s) for this commodity`);
    }
  } else {
    warnings.push("No registered foreign buyer entities found for this exact HS/country combination");
  }

  // 2. Shipment Activity Score (0 - 30 points)
  let shipmentActivity = 0;
  if (shipmentCount > 0) {
    // Score based on count (up to 15 pts) and total value (up to 15 pts)
    const countPts = Math.min(15, Math.round(shipmentCount * 3));
    
    // Value tiers: < $50k = 4, < $250k = 8, < $1M = 12, >= $1M = 15
    let valuePts = 4;
    if (totalShipmentValue >= 1_000_000) valuePts = 15;
    else if (totalShipmentValue >= 250_000) valuePts = 12;
    else if (totalShipmentValue >= 50_000) valuePts = 8;

    shipmentActivity = countPts + valuePts;

    if (totalShipmentValue > 0) {
      const formattedVal = totalShipmentValue >= 1_000_000
        ? `$${(totalShipmentValue / 1_000_000).toFixed(2)}M`
        : `$${totalShipmentValue.toLocaleString()}`;
      positiveFactors.push(`Active customs manifest flow with ${shipmentCount} verified shipment(s) totaling ${formattedVal}`);
      if (averageShipmentValue >= 50_000) {
        positiveFactors.push(`High average manifest transaction size ($${Math.round(averageShipmentValue).toLocaleString()} / shipment)`);
      }
    } else {
      positiveFactors.push(`Recorded ${shipmentCount} active bill of lading manifest(s) in this lane`);
    }
  } else {
    warnings.push("Zero verified customs shipment records in database for this specific trade lane");
  }

  // 3. Buyer Availability & Reliability (0 - 20 points)
  let buyerAvailability = 0;
  if (buyerCount > 0) {
    const verifiedRatio = verifiedBuyerCount / buyerCount;
    buyerAvailability = Math.round(10 + verifiedRatio * 10);
    if (verifiedBuyerCount > 0) {
      positiveFactors.push(`${verifiedBuyerCount} buyer(s) are officially verified with audited company records`);
    }
  } else {
    buyerAvailability = 0;
  }

  // 4. Supplier Competition Balance (0 - 20 points)
  // Healthy market has some suppliers (validation) but not overwhelming saturation relative to buyers
  let supplierCompetition = 10; // baseline
  if (supplierCount === 0 && buyerCount > 0) {
    // Zero suppliers = open market advantage for new entrants!
    supplierCompetition = 18;
    positiveFactors.push("Low domestic supplier saturation offers competitive early-mover advantage");
  } else if (supplierCount > 0 && buyerCount > 0) {
    const ratio = supplierCount / buyerCount;
    if (ratio <= 1.5) {
      supplierCompetition = 20;
      positiveFactors.push("Balanced supplier-to-buyer ratio indicating healthy competitive dynamics");
    } else if (ratio <= 3) {
      supplierCompetition = 14;
      warnings.push("Moderate supplier competition; distinct quality or price positioning required");
    } else {
      supplierCompetition = 8;
      warnings.push("High supplier saturation relative to registered buyers in this corridor");
    }
  } else if (supplierCount > 0 && buyerCount === 0) {
    supplierCompetition = 6;
    warnings.push("Existing suppliers present but unconfirmed direct buyer demand");
  } else {
    supplierCompetition = 5;
  }

  // 5. Data Confidence Calculation (0 - 100%)
  const totalSignals = (buyerCount > 0 ? 1 : 0) +
                       (shipmentCount > 0 ? 1 : 0) +
                       (totalShipmentValue > 0 ? 1 : 0) +
                       (historicalYears > 0 ? 1 : 0);
  const dataConfidence = Math.min(100, Math.round((totalSignals / 4) * 100));

  if (dataConfidence < 50) {
    warnings.push("Limited historical sample size; market metrics reflect available internal dataset");
  }

  // Raw combined score (0 - 100)
  const rawScore = buyerDemand + shipmentActivity + buyerAvailability + supplierCompetition;
  const overall = Math.min(100, Math.max(0, rawScore));

  // Determine qualitative tier
  let tier = "High Risk / Low Data";
  if (overall >= 75) tier = "Strong Opportunity";
  else if (overall >= 50) tier = "Moderate Opportunity";
  else if (overall >= 25) tier = "Emerging Market";

  return {
    overall,
    tier,
    breakdown: {
      buyerDemand,
      shipmentActivity,
      buyerAvailability,
      supplierCompetition,
      dataConfidence,
    },
    explanation: {
      positiveFactors: positiveFactors.length > 0 ? positiveFactors : ["Market entry baseline assessment"],
      warnings: warnings.length > 0 ? warnings : ["No major structural market risks detected"],
    },
  };
}
