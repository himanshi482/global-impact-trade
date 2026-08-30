import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getUnifiedMarketAnalysis } from "@/lib/marketIntelligence";

export async function POST(request, { params }) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId) || numericId < 1) {
    return Response.json({ error: "Invalid analysis ID" }, { status: 400 });
  }

  try {
    const rows = await query(
      `SELECT id, hs_code AS hsCode, country, direction, filters
       FROM saved_market_analyses
       WHERE id = ? AND user_id = ?`,
      [numericId, user.id]
    );

    const saved = rows[0];
    if (!saved) {
      return Response.json(
        { error: "Saved analysis not found or not owned by your account" },
        { status: 404 }
      );
    }

    // Run fresh intelligence analysis with current database data
    const freshAnalysis = await getUnifiedMarketAnalysis({
      hsCode: saved.hsCode,
      country: saved.country,
      direction: saved.direction || "export",
      userId: user.id,
      userRole: user.role,
    });

    // Update opportunity score and updated_at on the saved record
    await query(
      `UPDATE saved_market_analyses
       SET opportunity_score = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [freshAnalysis.score.overall, numericId]
    );

    return Response.json({
      message: "Analysis re-run successfully",
      savedRecord: {
        id: numericId,
        hsCode: saved.hsCode,
        country: saved.country,
        direction: saved.direction,
        opportunityScore: freshAnalysis.score.overall,
      },
      analysis: freshAnalysis,
    });
  } catch (err) {
    console.error("POST /api/market-analysis/saved/[id]/rerun error:", err);
    return Response.json({ error: "Failed to re-run market analysis" }, { status: 500 });
  }
}
