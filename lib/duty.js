// Centralized Indian customs duty calculation.
//
// Deliberately the ONLY place this math happens — the API route calls this,
// nothing else computes duty. Rates always come from the hs_codes table,
// never from the request body, so a client can't submit its own BCD/IGST
// rate and get a fabricated result.
//
// Reference order (standard Indian import duty stack):
//   1. BCD (Basic Customs Duty)   = assessableValue * bcdRate
//   2. SWS (Social Welfare Surcharge) = BCD * swsRate   (on BCD, not on assessable value)
//   3. IGST                        = (assessableValue + BCD + SWS) * igstRate
//   4. Total customs duty          = BCD + SWS + IGST
//   5. Landed cost                 = assessableValue + freight + insurance + total customs duty

function parseRate(rateString) {
  if (!rateString) return 0;
  const match = String(rateString).match(/[\d.]+/);
  return match ? parseFloat(match[0]) / 100 : 0;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {{assessableValue: number, freight?: number, insurance?: number}} input
 * @param {{bcd: string|null, sws: string|null, igst: string|null}} rates  raw strings from hs_codes, e.g. "10%"
 */
export function calculateDuty(input, rates) {
  const { assessableValue, freight = 0, insurance = 0 } = input;

  const bcdRate = parseRate(rates.bcd);
  const swsRate = parseRate(rates.sws);
  const igstRate = parseRate(rates.igst);

  const bcd = assessableValue * bcdRate;
  const sws = bcd * swsRate;
  const igst = (assessableValue + bcd + sws) * igstRate;
  const totalCustomsDuty = bcd + sws + igst;
  const landedCost = assessableValue + freight + insurance + totalCustomsDuty;

  return {
    assessableValue: round2(assessableValue),
    freight: round2(freight),
    insurance: round2(insurance),
    rates: {
      bcd: rates.bcd || "0%",
      sws: rates.sws || "0%",
      igst: rates.igst || "0%",
    },
    breakdown: {
      bcd: round2(bcd),
      sws: round2(sws),
      igst: round2(igst),
    },
    totalCustomsDuty: round2(totalCustomsDuty),
    landedCost: round2(landedCost),
  };
}
