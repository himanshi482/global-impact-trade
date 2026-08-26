import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parsePagination, parseSort, paginatedResponse } from "@/lib/http";

const SORTABLE = {
  code: "code",
  chapter: "chapter",
};

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = parsePagination(searchParams);
  const orderBy = parseSort(searchParams, SORTABLE, "code:asc");

  const code = searchParams.get("code");
  const description = searchParams.get("description");
  const chapter = searchParams.get("chapter");
  const country = searchParams.get("country");
  const q = searchParams.get("q"); // free-text: matches code or description

  const where = [];
  const params = [];

  if (code) {
    where.push("code LIKE ?");
    params.push(`${code}%`);
  }
  if (description) {
    where.push("description LIKE ?");
    params.push(`%${description}%`);
  }
  if (chapter) {
    where.push("chapter = ?");
    params.push(chapter);
  }
  if (country) {
    where.push("country = ?");
    params.push(country);
  }
  if (q) {
    where.push("(code LIKE ? OR description LIKE ?)");
    params.push(`${q}%`, `%${q}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows, countRows] = await Promise.all([
      query(
        `SELECT id, code, description, chapter, bcd, sws, igst, country
         FROM hs_codes
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM hs_codes ${whereClause}`, params),
    ]);

    return Response.json(paginatedResponse({ rows, total: countRows[0].total, page, limit }));
  } catch (err) {
    console.error("GET /api/hs-codes error:", err);
    return Response.json({ error: "Failed to load HS codes" }, { status: 500 });
  }
}
