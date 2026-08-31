import { query } from "./db";

/**
 * Calculates a lead score (0-100), potential tier (LOW, MEDIUM, HIGH),
 * and a detailed explanation of the score based on verification status,
 * contact details, import/export volume, and actual shipment records.
 * 
 * @param {Object} leadEntity - The buyer or supplier database object
 * @param {'buyer' | 'supplier'} type - The type of lead
 * @returns {Promise<{ score: number, potential_tier: 'LOW' | 'MEDIUM' | 'HIGH', reason: string }>}
 */
export async function calculateLeadScore(leadEntity, type) {
  let score = 0;
  const factors = [];
  const negatives = [];

  // 1. Verification Status (up to 20 pts)
  if (leadEntity.verified) {
    score += 20;
    factors.push("Verified company status (+20 pts)");
  } else {
    negatives.push("Company is not officially verified (+0 pts)");
  }

  // 2. Contact details completeness (up to 20 pts)
  let contactPts = 0;
  if (leadEntity.contact_person && (leadEntity.email || leadEntity.phone)) {
    contactPts += 10;
  }
  if (leadEntity.website) {
    contactPts += 10;
  }
  score += contactPts;
  if (contactPts > 0) {
    factors.push(`Contact profile completeness: ${contactPts}/20 pts (+${contactPts} pts)`);
  } else {
    negatives.push("Missing direct contact person or digital channels (+0 pts)");
  }

  // 3. Volume Score (up to 30 pts)
  let volumePts = 5;
  const volumeStr = (type === "buyer" ? leadEntity.import_volume : leadEntity.export_volume) || "";
  const volLower = volumeStr.toLowerCase();

  if (
    volLower.includes("high") ||
    volLower.includes("large") ||
    volLower.includes("million") ||
    volLower.includes(">$1m") ||
    volLower.includes(">1m") ||
    volLower.includes("level 4") ||
    volLower.includes("level 5")
  ) {
    volumePts = 30;
  } else if (
    volLower.includes("medium") ||
    volLower.includes("moderate") ||
    volLower.includes("250k") ||
    volLower.includes("500k") ||
    volLower.includes("level 3")
  ) {
    volumePts = 20;
  } else if (
    volLower.includes("low") ||
    volLower.includes("small") ||
    volLower.includes("100k") ||
    volLower.includes("level 1") ||
    volLower.includes("level 2")
  ) {
    volumePts = 10;
  }

  score += volumePts;
  factors.push(`Volume tier (${volumeStr || "Unknown"}): +${volumePts} pts`);

  // 4. Shipment Activity (up to 30 pts)
  let shipmentCount = 0;
  try {
    const colName = type === "buyer" ? "importer" : "exporter";
    const rows = await query(
      `SELECT COUNT(*) as cnt FROM shipments WHERE \`${colName}\` = ?`,
      [leadEntity.company_name]
    );
    shipmentCount = rows[0]?.cnt || 0;
  } catch (err) {
    console.error("Error fetching shipment count for lead scoring:", err);
  }

  let shipmentPts = 0;
  if (shipmentCount >= 10) {
    shipmentPts = 30;
  } else if (shipmentCount >= 5) {
    shipmentPts = 20;
  } else if (shipmentCount >= 1) {
    shipmentPts = 10;
  }

  score += shipmentPts;
  if (shipmentPts > 0) {
    factors.push(`Customs activity: ${shipmentCount} matching manifest shipment(s) found (+${shipmentPts} pts)`);
  } else {
    negatives.push("No customs manifest shipments found in database (+0 pts)");
  }

  // Double check score bound
  score = Math.min(100, Math.max(0, score));

  // Determine potential tier
  let potential_tier = "LOW";
  if (score >= 70) {
    potential_tier = "HIGH";
  } else if (score >= 40) {
    potential_tier = "MEDIUM";
  }

  // Compose detailed explanation
  const reason = [
    `### Lead Score Breakdown: ${score}/100 (${potential_tier} Potential)`,
    "",
    "**Positive Factors:**",
    ...factors.map(f => `- ${f}`),
    "",
    "**Areas for Verification:**",
    ...negatives.map(n => `- ${n}`)
  ].join("\n");

  return {
    score,
    potential_tier,
    reason
  };
}
