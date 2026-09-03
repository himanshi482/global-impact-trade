// app/api/export-planner/saved/route.js
// Stage 3 Phase 3 — GET & POST /api/export-planner/saved

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { evaluateExportOpportunity } from "@/lib/exportDecisionEngine";

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;

  try {
    const rows = await query(
      `SELECT id, user_id, name, product, hs_code, origin_country, target_country,
              input_data, analysis_result, created_at, updated_at
       FROM saved_export_plans
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user.id]
    );

    const plans = rows.map((r) => {
      let inputData = r.input_data;
      let analysisResult = r.analysis_result;
      if (typeof inputData === "string") {
        try { inputData = JSON.parse(inputData); } catch {}
      }
      if (typeof analysisResult === "string") {
        try { analysisResult = JSON.parse(analysisResult); } catch {}
      }

      return {
        id: r.id,
        name: r.name,
        product: r.product,
        hsCode: r.hs_code != null ? String(r.hs_code) : null,
        originCountry: r.origin_country,
        targetCountry: r.target_country,
        opportunityScore: analysisResult?.scores?.finalOpportunityScore ?? null,
        decision: analysisResult?.recommendation?.decision ?? null,
        inputData,
        analysisResult,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    return NextResponse.json({ plans, total: plans.length });
  } catch (err) {
    console.error("GET /api/export-planner/saved error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve saved export plans" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const name = body.name ? String(body.name).trim().slice(0, 255) : "Export Strategic Plan";
  const hsCode = body.hsCode ? String(body.hsCode).trim() : "";
  const product = body.product ? String(body.product).trim() : "";
  const originCountry = body.originCountry ? String(body.originCountry).trim() : "India";
  const targetCountry = body.targetCountry ? String(body.targetCountry).trim() : "";

  const inputData = {
    hsCode,
    product,
    originCountry,
    targetCountry,
    price: Math.max(0, parseFloat(body.price) || 0),
    quantity: Math.max(1, parseFloat(body.quantity) || 1),
    shipping: Math.max(0, parseFloat(body.shipping) || 0),
    insurance: Math.max(0, parseFloat(body.insurance) || 0),
    otherCosts: Math.max(0, parseFloat(body.otherCosts) || 0),
    targetSellingPrice: body.targetSellingPrice ? parseFloat(body.targetSellingPrice) : null,
  };

  try {
    // If analysisResult was supplied by client, verify/re-evaluate or store
    let analysisResult = body.analysisResult;
    if (!analysisResult) {
      analysisResult = await evaluateExportOpportunity({
        ...inputData,
        userId: user.id,
        userRole: user.role,
      });
    }

    const result = await query(
      `INSERT INTO saved_export_plans (user_id, name, product, hs_code, origin_country, target_country, input_data, analysis_result)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        name,
        product || null,
        hsCode || null,
        originCountry || null,
        targetCountry || null,
        JSON.stringify(inputData),
        JSON.stringify(analysisResult),
      ]
    );

    return NextResponse.json(
      { id: result.insertId, message: "Export plan saved successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/export-planner/saved error:", err);
    return NextResponse.json(
      { error: "Failed to save export plan" },
      { status: 500 }
    );
  }
}
