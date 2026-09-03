// app/api/export-planner/saved/[id]/rerun/route.js
// Stage 3 Phase 3 — POST /api/export-planner/saved/[id]/rerun

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { evaluateExportOpportunity } from "@/lib/exportDecisionEngine";

export async function POST(request, { params }) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "market-analysis", String(user.id));
  if (limited) return limited;

  const { id } = await params;
  const planId = parseInt(id, 10);
  if (!Number.isInteger(planId) || planId <= 0) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  try {
    const rows = await query(
      `SELECT id, user_id, input_data FROM saved_export_plans WHERE id = ? AND user_id = ?`,
      [planId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Export plan not found" }, { status: 404 });
    }

    let inputData = rows[0].input_data;
    if (typeof inputData === "string") {
      try { inputData = JSON.parse(inputData); } catch { inputData = {}; }
    }

    // Re-evaluate opportunity with latest live database numbers
    const freshAnalysis = await evaluateExportOpportunity({
      ...inputData,
      userId: user.id,
      userRole: user.role,
    });

    // Update the saved record with fresh snapshot
    await query(
      `UPDATE saved_export_plans SET analysis_result = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      [JSON.stringify(freshAnalysis), planId, user.id]
    );

    return NextResponse.json({
      success: true,
      message: "Export plan re-evaluated successfully with live repository metrics",
      analysis: freshAnalysis,
    });
  } catch (err) {
    console.error("POST /api/export-planner/saved/[id]/rerun error:", err);
    return NextResponse.json(
      { error: "Failed to re-run export plan analysis" },
      { status: 500 }
    );
  }
}
