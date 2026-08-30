import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  try {
    const rows = await query(
      `SELECT id, hs_code AS hsCode, country, direction, filters,
              opportunity_score AS opportunityScore,
              created_at AS createdAt, updated_at AS updatedAt
       FROM saved_market_analyses
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 50`,
      [user.id]
    );

    return Response.json({ savedAnalyses: rows });
  } catch (err) {
    console.error("GET /api/market-analysis/saved error:", err);
    return Response.json({ error: "Failed to load saved analyses" }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { hsCode, country, direction, filters, opportunityScore } = body;

  try {
    const result = await query(
      `INSERT INTO saved_market_analyses (user_id, hs_code, country, direction, filters, opportunity_score)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        hsCode || null,
        country || null,
        direction || "export",
        filters ? JSON.stringify(filters) : null,
        Number.isFinite(opportunityScore) ? Number(opportunityScore) : 0,
      ]
    );

    return Response.json(
      {
        id: result.insertId,
        message: "Market analysis saved successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/market-analysis/saved error:", err);
    return Response.json({ error: "Failed to save market analysis" }, { status: 500 });
  }
}
