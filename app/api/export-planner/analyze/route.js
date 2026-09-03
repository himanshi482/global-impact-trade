// app/api/export-planner/analyze/route.js
// Stage 3 Phase 3 — GET & POST /api/export-planner/analyze

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
  const targetSellingPrice = searchParams.get("targetSellingPrice")
    ? parseFloat(searchParams.get("targetSellingPrice"))
    : null;

  if (hsCode && hsCode.length > 30) {
    return NextResponse.json({ error: "Invalid HS code" }, { status: 400 });
  }

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
      targetSellingPrice,
      userId: user.id,
      userRole: user.role,
    });

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("GET /api/export-planner/analyze error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate export opportunity" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "market-analysis", String(user.id));
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const hsCode = body.hsCode ? String(body.hsCode).trim() : "";
  const product = body.product ? String(body.product).trim() : "";
  const originCountry = body.originCountry ? String(body.originCountry).trim() : "India";
  const targetCountry = body.targetCountry ? String(body.targetCountry).trim() : "";
  const price = Math.max(0, parseFloat(body.price) || 0);
  const quantity = Math.max(1, parseFloat(body.quantity) || 1);
  const shipping = Math.max(0, parseFloat(body.shipping) || 0);
  const insurance = Math.max(0, parseFloat(body.insurance) || 0);
  const otherCosts = Math.max(0, parseFloat(body.otherCosts) || 0);
  const targetSellingPrice = body.targetSellingPrice !== undefined && body.targetSellingPrice !== null
    ? parseFloat(body.targetSellingPrice)
    : null;

  if (hsCode && hsCode.length > 30) {
    return NextResponse.json({ error: "Invalid HS code" }, { status: 400 });
  }

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
      targetSellingPrice,
      userId: user.id,
      userRole: user.role,
    });

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("POST /api/export-planner/analyze error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate export opportunity" },
      { status: 500 }
    );
  }
}
