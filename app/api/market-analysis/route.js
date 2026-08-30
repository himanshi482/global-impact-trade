import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { getUnifiedMarketAnalysis } from "@/lib/marketIntelligence";

export async function GET(request) {
  // 1. Authentication Guard
  const user = await requireUser();
  if (user instanceof Response) return user;

  // 2. Rate Limiter Guard
  const rateLimit = rateLimitResponse(request, "market-analysis", String(user.id));
  if (rateLimit) return rateLimit;

  try {
    const { searchParams } = new URL(request.url);
    const hsCode = searchParams.get("hsCode")?.trim() || null;
    const country = searchParams.get("country")?.trim() || null;
    const year = searchParams.get("year")?.trim() || "all";
    const direction = searchParams.get("direction")?.trim() || "export";

    // Validate direction enum
    const validDirections = ["export", "import", "all"];
    const sanitizedDirection = validDirections.includes(direction) ? direction : "export";

    // Length limit checks on search filters
    if (hsCode && hsCode.length > 30) {
      return Response.json({ error: "Invalid HS Code parameter" }, { status: 400 });
    }
    if (country && country.length > 100) {
      return Response.json({ error: "Invalid country parameter" }, { status: 400 });
    }

    const analysis = await getUnifiedMarketAnalysis({
      hsCode,
      country,
      year,
      direction: sanitizedDirection,
      userId: user.id,
      userRole: user.role,
    });

    return Response.json(analysis);
  } catch (err) {
    console.error("GET /api/market-analysis error:", err);
    return Response.json(
      { error: "Failed to generate market intelligence report" },
      { status: 500 }
    );
  }
}
