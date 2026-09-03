/**
 * lib/landedCost.js
 * Stage 3 Phase 3 — Tariff & Landed Cost Calculation Engine.
 *
 * Integrates database-backed tariff rates from `hs_codes` with export freight,
 * insurance, and handling costs. If tariff rates are not available in the database,
 * it NEVER invents them and explicitly reports `available: false`.
 *
 * IMPORTANT: HS codes are ALWAYS strings (e.g. "010121").
 */

import { query } from "./db";
import { calculateDuty } from "./duty";

function round2(n) {
  const num = Number(n) || 0;
  return Math.round(num * 100) / 100;
}

/**
 * Calculates landed cost and tariff duty for an export shipment.
 *
 * @param {object} params
 * @param {string|null} params.hsCode - 6-digit or chapter HS code string
 * @param {number} params.price - Unit export/procurement price
 * @param {number} params.quantity - Number of units being shipped
 * @param {number} [params.shipping=0] - Total shipping/freight cost
 * @param {number} [params.insurance=0] - Total cargo insurance cost
 * @param {number} [params.otherCosts=0] - Clearance, handling, and port fees
 * @param {number|null} [params.targetSellingPrice] - Optional target destination selling price per unit
 * @param {string|null} [params.targetCountry] - Optional destination country
 * @returns {Promise<object>}
 */
export async function calculateLandedCost({
  hsCode,
  price = 0,
  quantity = 1,
  shipping = 0,
  insurance = 0,
  otherCosts = 0,
  targetSellingPrice = null,
  targetCountry = null,
}) {
  const cleanHs = hsCode ? String(hsCode).trim() : "";
  const unitPrice = Math.max(0, Number(price) || 0);
  const qty = Math.max(1, Number(quantity) || 1);
  const freightCost = Math.max(0, Number(shipping) || 0);
  const insuranceCost = Math.max(0, Number(insurance) || 0);
  const otherFees = Math.max(0, Number(otherCosts) || 0);
  const productCost = round2(unitPrice * qty);

  // Check database for official tariff rates matching the HS code
  let hsRow = null;
  if (cleanHs) {
    // Attempt exact match first
    const rows = await query(
      `SELECT code, description, bcd, sws, igst, country 
       FROM hs_codes 
       WHERE code = ? 
       LIMIT 1`,
      [cleanHs]
    );

    if (rows && rows.length > 0) {
      hsRow = rows[0];
    } else {
      // Fallback: check 4-digit prefix or chapter prefix
      const prefixRows = await query(
        `SELECT code, description, bcd, sws, igst, country 
         FROM hs_codes 
         WHERE code LIKE ? 
         ORDER BY LENGTH(code) DESC 
         LIMIT 1`,
        [`${cleanHs.slice(0, 4)}%`]
      );
      if (prefixRows && prefixRows.length > 0) {
        hsRow = prefixRows[0];
      }
    }
  }

  // If tariff data is not found or unpopulated
  if (!hsRow || (!hsRow.bcd && !hsRow.sws && !hsRow.igst)) {
    const baseLanded = round2(productCost + freightCost + insuranceCost + otherFees);
    const costPerUnit = round2(baseLanded / qty);

    let margin = null;
    let marginPct = null;
    if (targetSellingPrice !== null && targetSellingPrice !== undefined && Number(targetSellingPrice) > 0) {
      const totalRevenue = round2(Number(targetSellingPrice) * qty);
      margin = round2(totalRevenue - baseLanded);
      marginPct = baseLanded > 0 ? round2((margin / baseLanded) * 100) : 0;
    }

    return {
      available: false,
      reason: "Tariff data not available",
      productCost,
      shipping: freightCost,
      insurance: insuranceCost,
      otherCosts: otherFees,
      totalLandedCost: baseLanded,
      costPerUnit,
      estimatedMargin: margin,
      marginPercentage: marginPct,
      hsCode: cleanHs,
      rates: null,
      customsDuty: null,
    };
  }

  // Tariff rate is available in database -> compute exact duty stack
  const dutyResult = calculateDuty(
    {
      assessableValue: productCost,
      freight: freightCost,
      insurance: insuranceCost,
    },
    {
      bcd: hsRow.bcd,
      sws: hsRow.sws,
      igst: hsRow.igst,
    }
  );

  const totalCustomsDuty = dutyResult.totalCustomsDuty;
  const totalLandedCost = round2(productCost + freightCost + insuranceCost + otherFees + totalCustomsDuty);
  const costPerUnit = round2(totalLandedCost / qty);

  let margin = null;
  let marginPct = null;
  if (targetSellingPrice !== null && targetSellingPrice !== undefined && Number(targetSellingPrice) > 0) {
    const totalRevenue = round2(Number(targetSellingPrice) * qty);
    margin = round2(totalRevenue - totalLandedCost);
    marginPct = totalLandedCost > 0 ? round2((margin / totalLandedCost) * 100) : 0;
  }

  return {
    available: true,
    hsCode: cleanHs,
    productDescription: hsRow.description,
    productCost,
    shipping: freightCost,
    insurance: insuranceCost,
    otherCosts: otherFees,
    customsDuty: {
      total: totalCustomsDuty,
      bcd: dutyResult.breakdown.bcd,
      sws: dutyResult.breakdown.sws,
      igst: dutyResult.breakdown.igst,
      rates: dutyResult.rates,
    },
    totalLandedCost,
    costPerUnit,
    estimatedMargin: margin,
    marginPercentage: marginPct,
  };
}
