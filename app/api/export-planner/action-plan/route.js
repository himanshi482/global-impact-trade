// app/api/export-planner/action-plan/route.js
// Stage 3 Phase 3 — GET /api/export-planner/action-plan

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { evaluateExportOpportunity } from "@/lib/exportDecisionEngine";

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "market-analysis", String(user.id));
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const hsCode = searchParams.get("hsCode")?.trim() || "";
  const product = searchParams.get("product")?.trim() || "";
  const originCountry = searchParams.get("originCountry")?.trim() || "India";
  const targetCountry = searchParams.get("targetCountry")?.trim() || "";
  const price = parseFloat(searchParams.get("price") || "0") || 0;
  const quantity = parseFloat(searchParams.get("quantity") || "1") || 1;
  const shipping = parseFloat(searchParams.get("shipping") || "0") || 0;
  const insurance = parseFloat(searchParams.get("insurance") || "0") || 0;
  const otherCosts = parseFloat(searchParams.get("otherCosts") || "0") || 0;

  try {
    const analysis = await evaluateExportOpportunity({
      hsCode,
      product,
      originCountry,
      targetCountry,
      price,
      quantity,
      shipping,
      insurance,
      otherCosts,
      userId: user.id,
      userRole: user.role,
    });

    return NextResponse.json({
      hsCode,
      targetCountry,
      recommendation: analysis.recommendation,
      readiness: analysis.readinessAssessment,
      actionPlan: analysis.actionPlan,
    });
  } catch (err) {
    console.error("GET /api/export-planner/action-plan error:", err);
    return NextResponse.json(
      { error: "Failed to generate export action plan" },
      { status: 500 }
    );
  }
}
