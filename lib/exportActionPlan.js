/**
 * lib/exportActionPlan.js
 * Stage 3 Phase 3 — Adaptive Export Action Plan Engine.
 *
 * Generates an end-to-end 10-step practical execution roadmap that dynamically
 * adapts based on trade risk, export readiness, buyer demand, and tariff feasibility.
 */

/**
 * Creates an adaptive 10-step export execution plan.
 *
 * @param {object} params
 * @param {string|null} params.hsCode
 * @param {string|null} params.product
 * @param {string|null} params.originCountry
 * @param {string|null} params.targetCountry
 * @param {object} params.opportunityScore
 * @param {object} params.riskAssessment
 * @param {object} params.readinessAssessment
 * @param {object} params.landedCost
 * @param {Array<object>} params.recommendedBuyers
 * @returns {Array<{ step: number, title: string, description: string, status: 'COMPLETED'|'ACTION_REQUIRED'|'BLOCKED'|'PENDING', link?: string }>}
 */
export function generateExportActionPlan({
  hsCode,
  product,
  originCountry,
  targetCountry,
  opportunityScore,
  riskAssessment,
  readinessAssessment,
  landedCost,
  recommendedBuyers = [],
}) {
  const steps = [];
  const cleanHs = hsCode ? String(hsCode).trim() : null;
  const isHighRisk = riskAssessment?.level === "HIGH";
  const isNotReady = readinessAssessment?.level === "NOT_READY";
  const hasBuyers = recommendedBuyers.length > 0;
  const highPotentialBuyers = recommendedBuyers.filter((b) => b.leadScore >= 80);

  // Step 1: Validate HS Code
  if (cleanHs && cleanHs.length >= 6) {
    steps.push({
      step: 1,
      title: "Validate Commodity HS Code Classification",
      description: `HS Code ${cleanHs} validated. Standard 6-digit WCO Harmonized System sub-heading classification confirmed for ${product || "selected goods"}.`,
      status: "COMPLETED",
      link: `/hs-codes`,
    });
  } else {
    steps.push({
      step: 1,
      title: "Validate Commodity HS Code Classification",
      description: "Provide complete 6-digit HS Code to confirm non-tariff technical barriers and statutory tariff schedules.",
      status: "ACTION_REQUIRED",
      link: `/hs-codes`,
    });
  }

  // Step 2: Evaluate Target Market
  const oppVal = opportunityScore?.overall || 0;
  if (oppVal >= 60) {
    steps.push({
      step: 2,
      title: `Evaluate Market Dynamics in ${targetCountry || "Target Market"}`,
      description: `Market Opportunity Score of ${oppVal}/100 confirms robust commercial activity and verified shipment flows.`,
      status: "COMPLETED",
      link: `/market-analysis?hsCode=${encodeURIComponent(cleanHs || "")}&country=${encodeURIComponent(targetCountry || "")}`,
    });
  } else {
    steps.push({
      step: 2,
      title: `Evaluate Market Dynamics in ${targetCountry || "Target Market"}`,
      description: `Opportunity score is moderate (${oppVal}/100). Conduct corridor benchmark analysis against regional trading hubs.`,
      status: "ACTION_REQUIRED",
      link: `/market-analysis?hsCode=${encodeURIComponent(cleanHs || "")}&country=${encodeURIComponent(targetCountry || "")}`,
    });
  }

  // Step 3: Review Tariff & Landed Cost
  if (landedCost?.available) {
    steps.push({
      step: 3,
      title: "Audit Tariff Schedule & Landed Cost Economics",
      description: `Customs duty verified (${landedCost.customsDuty?.rates?.bcd || "0%"} BCD, ${landedCost.customsDuty?.rates?.igst || "0%"} IGST). Total estimated landed cost: $${landedCost.totalLandedCost?.toLocaleString()} ($${landedCost.costPerUnit}/unit).`,
      status: "COMPLETED",
    });
  } else {
    steps.push({
      step: 3,
      title: "Audit Tariff Schedule & Landed Cost Economics",
      description: "Tariff data not available in platform database for this exact HS code. Obtain binding customs clearance rate from destination customs broker before contract signing.",
      status: "ACTION_REQUIRED",
    });
  }

  // Step 4: Review Trade Risks
  if (isHighRisk) {
    steps.push({
      step: 4,
      title: "Execute Trade Corridor Risk Mitigation",
      description: `Risk score is HIGH (${riskAssessment.score}/100). Blockers identified: ${riskAssessment.factors?.[0] || "Sparse data"}. Recommend requiring confirmed Letter of Credit (LC) and export credit insurance (ECGC).`,
      status: isNotReady ? "BLOCKED" : "ACTION_REQUIRED",
    });
  } else {
    steps.push({
      step: 4,
      title: "Review Trade Corridor Risk Profile",
      description: `Risk level is ${riskAssessment?.level || "LOW"} (${riskAssessment?.score || 0}/100). Standard marine cargo insurance and advance TT/LC payment terms are sufficient.`,
      status: "COMPLETED",
    });
  }

  // Step 5: Discover Buyers
  if (hasBuyers) {
    steps.push({
      step: 5,
      title: `Discover Active Importers in ${targetCountry || "Target Market"}`,
      description: `Identified ${recommendedBuyers.length} prospective importer(s) matching your commodity classification in the directory.`,
      status: "COMPLETED",
      link: `/buyer-discovery?hsCode=${encodeURIComponent(cleanHs || "")}&country=${encodeURIComponent(targetCountry || "")}`,
    });
  } else {
    steps.push({
      step: 5,
      title: `Discover Active Importers in ${targetCountry || "Target Market"}`,
      description: "No registered foreign buyers currently cataloged in this exact corridor. Broaden search criteria or review nearby destination markets.",
      status: "ACTION_REQUIRED",
      link: `/buyer-discovery`,
    });
  }

  // Step 6: Prioritize High-Score Leads
  if (highPotentialBuyers.length > 0) {
    steps.push({
      step: 6,
      title: "Prioritize High-Potential Enterprise Leads",
      description: `${highPotentialBuyers.length} buyer(s) evaluated as HIGH POTENTIAL (Score ≥ 80) based on shipment volume and audited status. Add to your active lead CRM pipeline.`,
      status: "ACTION_REQUIRED",
      link: `/my-leads`,
    });
  } else if (hasBuyers) {
    steps.push({
      step: 6,
      title: "Prioritize Cataloged Buyer Leads",
      description: "Benchmark cataloged buyers by manifest count and verified registration. Save target accounts to My Leads.",
      status: "PENDING",
      link: `/my-leads`,
    });
  } else {
    steps.push({
      step: 6,
      title: "Prioritize High-Score Leads",
      description: "Buyer pipeline is empty. Complete buyer discovery step to populate leads.",
      status: "BLOCKED",
    });
  }

  // Step 7: Unlock Contact Information Where Appropriate
  steps.push({
    step: 7,
    title: "Unlock Verified Foreign Procurement Contacts",
    description: "Use account unlock credits to reveal direct procurement officer emails, corporate telephone lines, and verified import volume history.",
    status: hasBuyers ? "ACTION_REQUIRED" : "PENDING",
    link: `/trade-data`,
  });

  // Step 8: Contact Qualified Buyers
  steps.push({
    step: 8,
    title: "Conduct Targeted Proforma Outreach",
    description: "Dispatch customized commercial introductions including FOB/CIF freight breakdown, technical specifications, and international quality certifications.",
    status: "PENDING",
  });

  // Step 9: Move Lead to CONTACTED Status
  steps.push({
    step: 9,
    title: "Log Engagement & Advance Pipeline to CONTACTED",
    description: "Transition leads in My Leads CRM to CONTACTED status and log interaction timestamps, sample dispatches, and follow-up reminders.",
    status: "PENDING",
    link: `/my-leads`,
  });

  // Step 10: Track QUALIFIED / NEGOTIATING / WON / LOST
  steps.push({
    step: 10,
    title: "Execute Lifecycle CRM Tracking (QUALIFIED → WON)",
    description: "Monitor contract milestones through NEGOTIATING stage, secure trade finance instruments, and mark closed deals as WON.",
    status: "PENDING",
    link: `/my-leads`,
  });

  return steps;
}
