/**
 * lib/buyerMarketMatching.js
 * Stage 3 Phase 3 — Buyer-to-Market Matching Engine.
 *
 * Connects Buyer Discovery with Market Analysis. Evaluates cataloged buyers
 * against user product/HS code and target country, computing a holistic
 * matchScore (0–100) and leadScore while strictly preserving contact masking.
 */

import { query } from "./db";
import { computeLeadScore } from "./leadScoring";

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Discovers and ranks top recommended buyers for a given export opportunity.
 *
 * @param {object} params
 * @param {string|null} params.hsCode
 * @param {string|null} params.product
 * @param {string|null} params.targetCountry
 * @param {number|null} params.userId
 * @param {boolean} [params.isAdmin=false]
 * @param {number} [params.limit=10]
 * @returns {Promise<Array<object>>}
 */
export async function getRecommendedBuyers({
  hsCode,
  product,
  targetCountry,
  userId,
  isAdmin = false,
  limit = 10,
}) {
  const cleanHs = hsCode ? String(hsCode).trim() : null;
  const cleanCountry = targetCountry ? String(targetCountry).trim() : null;
  const cleanProduct = product ? String(product).trim() : null;

  const where = [];
  const params = [];

  if (cleanHs) {
    where.push("(b.hs_code LIKE ? OR b.hs_chapter = ?)");
    params.push(`%${cleanHs}%`, cleanHs.slice(0, 2));
  }
  if (cleanCountry) {
    where.push("b.country LIKE ?");
    params.push(`%${cleanCountry}%`);
  }
  if (cleanProduct) {
    where.push("b.product LIKE ?");
    params.push(`%${cleanProduct}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Query buyers with joined shipment stats and unlock status
  const rows = await query(
    `SELECT b.id, b.company_name AS companyName, b.country, b.city, b.product,
            b.hs_code AS hsCode, b.import_volume AS importVolume, b.verified,
            b.contact_person AS contactPerson, b.email, b.phone, b.website,
            COUNT(sh.id) AS shipmentCount,
            COALESCE(SUM(sh.shipment_value), 0) AS totalShipmentValue,
            MAX(sh.shipment_date) AS lastShipmentDate,
            CASE WHEN MAX(ur.id) IS NOT NULL THEN TRUE ELSE FALSE END AS isUnlocked
     FROM buyers b
     LEFT JOIN shipments sh ON sh.importer = b.company_name
     LEFT JOIN unlock_requests ur ON ur.buyer_id = b.id AND ur.user_id = ? AND ur.status = 'GRANTED'
     ${whereClause}
     GROUP BY b.id
     ORDER BY b.verified DESC, shipmentCount DESC, b.id DESC
     LIMIT ?`,
    [userId || 0, ...params, Number(limit) * 2] // fetch extra to score & rank
  );

  const matched = rows.map((r) => {
    const unlocked = Boolean(r.isUnlocked) || isAdmin;

    const shipmentCount = Number(r.shipmentCount) || 0;
    const totalShipmentValue = parseFloat(r.totalShipmentValue) || 0;
    const isVerified = Boolean(r.verified);

    // Contextual match signals
    const hsMatch = cleanHs && r.hsCode && String(r.hsCode).startsWith(cleanHs.slice(0, 4));
    const countryMatch = cleanCountry && r.country && r.country.toLowerCase() === cleanCountry.toLowerCase();
    const productMatch = cleanProduct && r.product && r.product.toLowerCase().includes(cleanProduct.toLowerCase());

    // Compute deterministic lead score using existing engine
    const leadScoreResult = computeLeadScore({
      shipmentCount,
      totalShipmentValue,
      verified: isVerified,
      productMatch: Boolean(hsMatch || productMatch),
      countryMatch: Boolean(countryMatch),
      lastShipmentDate: r.lastShipmentDate,
    });

    // Compute Match Score (0–100) weighting relevance + quality
    let matchScore = 0;
    if (hsMatch) matchScore += 35;
    else if (cleanHs && r.hsCode && String(r.hsCode).slice(0, 2) === cleanHs.slice(0, 2)) matchScore += 20;

    if (countryMatch) matchScore += 25;
    if (isVerified) matchScore += 15;
    if (shipmentCount > 0) matchScore += 15;
    if (totalShipmentValue >= 100_000) matchScore += 10;

    matchScore = clamp(matchScore, 0, 100);

    return {
      id: r.id,
      companyName: r.companyName,
      country: r.country,
      city: r.city,
      product: r.product,
      hsCode: r.hsCode != null ? String(r.hsCode) : null,
      importVolume: r.importVolume,
      verified: isVerified,
      matchScore,
      leadScore: leadScoreResult.score,
      potential: leadScoreResult.potential,
      reasons: leadScoreResult.reasons,
      shipmentEvidence: {
        shipmentCount,
        totalShipmentValue,
        lastShipmentDate: r.lastShipmentDate,
      },
      isUnlocked: unlocked,
      // Contact masking: strip contact info unless unlocked
      contactPerson: unlocked ? r.contactPerson : null,
      email: unlocked ? r.email : null,
      phone: unlocked ? r.phone : null,
      website: unlocked ? r.website : null,
    };
  });

  // Sort descending by matchScore then leadScore
  matched.sort((a, b) => b.matchScore - a.matchScore || b.leadScore - a.leadScore);

  return matched.slice(0, Number(limit));
}
