import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { compareCountries } from "@/lib/marketIntelligence";

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const rateLimit = rateLimitResponse(request, "market-analysis", String(user.id));
  if (rateLimit) return rateLimit;

  try {
    const { searchParams } = new URL(request.url);
    const hsCode = searchParams.get("hsCode")?.trim() || null;
    const rawCountries = searchParams.get("countries");

    if (!rawCountries) {
      return Response.json(
        { error: "Query parameter 'countries' is required (comma-separated list of 2 to 5 countries)." },
        { status: 400 }
      );
    }

    const countries = rawCountries
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (countries.length < 2 || countries.length > 5) {
      return Response.json(
        { error: "Please provide between 2 and 5 distinct countries to compare." },
        { status: 400 }
      );
    }

    const comparisons = await compareCountries({
      hsCode,
      countries,
    });

    return Response.json({
      hsCode: hsCode || "All Commodities",
      comparisons,
    });
  } catch (err) {
    console.error("GET /api/market-analysis/compare error:", err);
    return Response.json(
      { error: err.message || "Failed to compare country markets" },
      { status: 500 }
    );
  }
}
