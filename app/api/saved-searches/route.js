import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  try {
    const rows = await query(
      `SELECT id, name, search_type AS searchType, query, filters, created_at AS createdAt, updated_at AS updatedAt
       FROM saved_searches
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
      [user.id]
    );

    const parsed = rows.map((r) => ({
      ...r,
      filters: typeof r.filters === "string" ? JSON.parse(r.filters) : r.filters,
    }));

    return Response.json({ data: parsed });
  } catch (err) {
    console.error("GET /api/saved-searches error:", err);
    return Response.json({ error: "Failed to load saved searches" }, { status: 500 });
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

  const { name, searchType, query: searchQuery, filters } = body;
  if (!name || !searchType) {
    return Response.json({ error: "Name and searchType are required" }, { status: 400 });
  }

  try {
    const result = await query(
      `INSERT INTO saved_searches (user_id, name, search_type, query, filters)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, name, searchType, searchQuery || null, filters ? JSON.stringify(filters) : null]
    );

    return Response.json({ id: result.insertId, message: "Search saved successfully" }, { status: 201 });
  } catch (err) {
    console.error("POST /api/saved-searches error:", err);
    return Response.json({ error: "Failed to save search" }, { status: 500 });
  }
}
