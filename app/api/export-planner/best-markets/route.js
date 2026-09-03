// app/api/export-planner/best-markets/route.js
// Stage 3 Phase 3 — GET /api/export-planner/best-markets

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { findBestMarkets } from "@/lib/marketIntelligence";
import { computeTradeRisk } from "@/lib/tradeRisk";
import { computeExportReadiness } from "@/lib/exportReadiness";

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "market-analysis", String(user.id));
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const hsCode = searchParams.get("hsCode")?.trim() || "";
  const product = searchParams.get("product")?.trim() || "";
  const originCountry = searchParams.get("originCountry")?.trim() || "India";
  const limit = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") || "6", 10) || 6));

  try {
    // Leverage existing findBestMarkets to query all candidate destinations
    const baseRankings = await findBestMarkets({
      hsCode: hsCode || null,
      product: product || null,
      limit: limit * 2, // fetch extra candidates to score
    });

    const detailedRankings = baseRankings.map((m) => {
      const country = m.country;
      const metrics = m.metrics;
      const oppScore = m.score;

      // Deterministic trade risk
      const risk = computeTradeRisk({
        hsCode,
        originCountry,
        targetCountry: country,
        metrics,
        scoreBreakdown: oppScore.breakdown,
      });

      // Export readiness
      const readiness = computeExportReadiness({
        hsCode,
        product,
        metrics,
        opportunityScore: oppScore,
        riskAssessment: risk,
      });

      // Sub-scores
      const marketScore = oppScore.overall;
      const demand = Math.min(100, Math.round((oppScore.breakdown.buyerDemand / 30) * 100));
      const competition = Math.min(100, Math.round((oppScore.breakdown.supplierCompetition / 20) * 100));
      
      let buyerQuality = 0;
      if (metrics.buyerCount > 0) {
        const verifiedRatio = metrics.verifiedBuyerCount / metrics.buyerCount;
        buyerQuality = Math.round(50 + verifiedRatio * 50);
      }

      const riskScore = risk.score;
      const costEfficiency = oppScore.breakdown.dataConfidence >= 50 ? 70 : 40;
      const exportReadiness = readiness.score;

      // Final Opportunity Score calculation
      const safety = 100 - riskScore;
      const finalOpportunityScore = clamp(
        Math.round(
          marketScore * 0.35 +
          exportReadiness * 0.25 +
          safety * 0.20 +
          demand * 0.10 +
          costEfficiency * 0.10
        ),
        0,
        100
      );

      return {
        country,
        metrics,
        marketScore,
        demand,
        competition,
        buyerQuality,
        risk: {
          score: riskScore,
          level: risk.level,
        },
        costEfficiency,
        exportReadiness,
        finalOpportunityScore,
      };
    });

    // Sort descending by finalOpportunityScore
    detailedRankings.sort((a, b) => b.finalOpportunityScore - a.finalOpportunityScore);

    return NextResponse.json({
      hsCode,
      product,
      originCountry,
      totalMarketsEvaluated: detailedRankings.length,
      markets: detailedRankings.slice(0, limit),
    });
  } catch (err) {
    console.error("GET /api/export-planner/best-markets error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate best market opportunities" },
      { status: 500 }
    );
  }
}
