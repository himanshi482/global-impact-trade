// app/api/export-planner/saved/[id]/route.js
// Stage 3 Phase 3 — GET & DELETE /api/export-planner/saved/[id]

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";

export async function GET(request, { params }) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;

  const { id } = await params;
  const planId = parseInt(id, 10);
  if (!Number.isInteger(planId) || planId <= 0) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  try {
    const rows = await query(
      `SELECT id, user_id, name, product, hs_code, origin_country, target_country,
              input_data, analysis_result, created_at, updated_at
       FROM saved_export_plans
       WHERE id = ? AND user_id = ?`,
      [planId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Export plan not found" }, { status: 404 });
    }

    const r = rows[0];
    let inputData = r.input_data;
    let analysisResult = r.analysis_result;
    if (typeof inputData === "string") {
      try { inputData = JSON.parse(inputData); } catch {}
    }
    if (typeof analysisResult === "string") {
      try { analysisResult = JSON.parse(analysisResult); } catch {}
    }

    return NextResponse.json({
      id: r.id,
      name: r.name,
      product: r.product,
      hsCode: r.hs_code != null ? String(r.hs_code) : null,
      originCountry: r.origin_country,
      targetCountry: r.target_country,
      inputData,
      analysisResult,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  } catch (err) {
    console.error("GET /api/export-planner/saved/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve export plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;

  const { id } = await params;
  const planId = parseInt(id, 10);
  if (!Number.isInteger(planId) || planId <= 0) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  try {
    const result = await query(
      `DELETE FROM saved_export_plans WHERE id = ? AND user_id = ?`,
      [planId, user.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Export plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Export plan deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/export-planner/saved/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete export plan" },
      { status: 500 }
    );
  }
}
