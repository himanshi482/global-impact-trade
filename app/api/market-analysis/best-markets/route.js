import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { findBestMarkets } from "@/lib/marketIntelligence";

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const rateLimit = rateLimitResponse(request, "market-analysis", String(user.id));
  if (rateLimit) return rateLimit;

  try {
    const { searchParams } = new URL(request.url);
    const hsCode = searchParams.get("hsCode")?.trim() || null;
    const product = searchParams.get("product")?.trim() || null;
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    const sanitizedLimit = Number.isFinite(limit) && limit >= 1 && limit <= 20 ? limit : 6;

    const bestMarkets = await findBestMarkets({
      hsCode,
      product,
      limit: sanitizedLimit,
    });

    return Response.json({
      hsCode: hsCode || "All Commodities",
      product: product || null,
      bestMarkets,
    });
  } catch (err) {
    console.error("GET /api/market-analysis/best-markets error:", err);
    return Response.json(
      { error: "Failed to discover best market opportunities" },
      { status: 500 }
    );
  }
}
