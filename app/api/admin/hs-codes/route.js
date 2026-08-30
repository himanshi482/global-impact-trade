import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { parsePagination, parseSort, paginatedResponse } from "@/lib/http";

const SORT_COLUMNS = {
  id: "id",
  code: "code",
  description: "description",
  chapter: "chapter",
  createdAt: "created_at",
};

export async function GET(request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const orderBy = parseSort(searchParams, SORT_COLUMNS, "code:asc");

    const conditions = [];
    const params = [];

    const q = searchParams.get("q")?.trim();
    if (q) {
      conditions.push("(code LIKE ? OR description LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like);
    }

    const code = searchParams.get("code")?.trim();
    if (code) {
      conditions.push("code LIKE ?");
      params.push(`%${code}%`);
    }

    const description = searchParams.get("description")?.trim();
    if (description) {
      conditions.push("description LIKE ?");
      params.push(`%${description}%`);
    }

    const chapter = searchParams.get("chapter")?.trim();
    if (chapter) {
      conditions.push("chapter = ?");
      params.push(chapter);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const countRows = await query(
      `SELECT COUNT(*) AS total FROM hs_codes ${where}`,
      params
    );
    const total = countRows[0].total;

    const rows = await query(
      `SELECT id, code, description, chapter, bcd, sws, igst, country, created_at
       FROM hs_codes ${where}
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return Response.json(paginatedResponse({ rows, total, page, limit }));
  } catch (err) {
    console.error("GET /api/admin/hs-codes error:", err);
    return Response.json(
      { error: "Failed to load HS codes" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { code, description, chapter, bcd, sws, igst, country } = body;

  if (!code || !description) {
    return Response.json(
      { error: "code and description are required" },
      { status: 400 }
    );
  }

  const trimmedCode = String(code).trim();
  const targetCountry = country?.trim() || "India";
  const hsChapter = chapter?.trim() || trimmedCode.slice(0, 2);

  try {
    // Duplicate-code protection
    const existing = await query(
      "SELECT id FROM hs_codes WHERE code = ? AND country = ?",
      [trimmedCode, targetCountry]
    );
    if (existing.length > 0) {
      return Response.json(
        { error: `HS code ${trimmedCode} already exists for ${targetCountry}` },
        { status: 409 }
      );
    }

    const result = await query(
      `INSERT INTO hs_codes (code, description, chapter, bcd, sws, igst, country)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        trimmedCode,
        String(description).trim(),
        hsChapter,
        bcd || null,
        sws || null,
        igst || null,
        targetCountry,
      ]
    );

    return Response.json(
      { id: result.insertId, message: "HS code created" },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/admin/hs-codes error:", err);
    return Response.json(
      { error: "Failed to create HS code" },
      { status: 500 }
    );
  }
}
