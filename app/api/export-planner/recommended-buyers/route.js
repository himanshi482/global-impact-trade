// app/api/export-planner/recommended-buyers/route.js
// Stage 3 Phase 3 — GET /api/export-planner/recommended-buyers

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { getRecommendedBuyers } from "@/lib/buyerMarketMatching";

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "market-analysis", String(user.id));
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const hsCode = searchParams.get("hsCode")?.trim() || "";
  const targetCountry = searchParams.get("targetCountry")?.trim() || "";
  const product = searchParams.get("product")?.trim() || "";
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10));

  try {
    const buyers = await getRecommendedBuyers({
      hsCode: hsCode || null,
      product: product || null,
      targetCountry: targetCountry || null,
      userId: user.id,
      isAdmin: user.role === "ADMIN",
      limit,
    });

    return NextResponse.json({
      hsCode,
      targetCountry,
      product,
      total: buyers.length,
      buyers,
    });
  } catch (err) {
    console.error("GET /api/export-planner/recommended-buyers error:", err);
    return NextResponse.json(
      { error: "Failed to fetch recommended buyer leads" },
      { status: 500 }
    );
  }
}
