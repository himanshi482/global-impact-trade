import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  try {
    const rows = await query(
      `SELECT id, search_type AS searchType, query, filters, created_at AS createdAt
       FROM search_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.id]
    );

    const parsed = rows.map((r) => ({
      ...r,
      filters: typeof r.filters === "string" ? JSON.parse(r.filters) : r.filters,
    }));

    return Response.json({ data: parsed });
  } catch (err) {
    console.error("GET /api/search-history error:", err);
    return Response.json({ error: "Failed to load search history" }, { status: 500 });
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

  const { searchType, query: searchQuery, filters } = body;
  if (!searchType) {
    return Response.json({ error: "searchType is required" }, { status: 400 });
  }

  try {
    const result = await query(
      `INSERT INTO search_history (user_id, search_type, query, filters)
       VALUES (?, ?, ?, ?)`,
      [user.id, searchType, searchQuery || null, filters ? JSON.stringify(filters) : null]
    );

    return Response.json({ id: result.insertId, message: "Search history recorded" }, { status: 201 });
  } catch (err) {
    console.error("POST /api/search-history error:", err);
    return Response.json({ error: "Failed to save search history" }, { status: 500 });
  }
}
