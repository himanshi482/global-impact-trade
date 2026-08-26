import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parsePagination, parseSort, paginatedResponse } from "@/lib/http";

const SORTABLE = {
  companyName: "company_name",
  country: "country",
  createdAt: "created_at",
};

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = parsePagination(searchParams);
  const orderBy = parseSort(searchParams, SORTABLE, "createdAt:desc");

  const product = searchParams.get("product");
  const country = searchParams.get("country");
  const hsCode = searchParams.get("hsCode");
  const hsChapter = searchParams.get("hsChapter");
  const q = searchParams.get("q");

  const where = [];
  const params = [];

  if (product) {
    where.push("product LIKE ?");
    params.push(`%${product}%`);
  }
  if (country) {
    where.push("country LIKE ?");
    params.push(`%${country}%`);
  }
  if (hsCode) {
    where.push("hs_code = ?");
    params.push(hsCode);
  }
  if (hsChapter) {
    where.push("hs_chapter = ?");
    params.push(hsChapter);
  }
  if (q) {
    where.push("(company_name LIKE ? OR product LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows, countRows] = await Promise.all([
      query(
        `SELECT id, company_name AS companyName, country, city, product,
                hs_code AS hsCode, hs_chapter AS hsChapter, export_volume AS exportVolume,
                verified, created_at AS createdAt
         FROM suppliers
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM suppliers ${whereClause}`, params),
    ]);

    return Response.json(paginatedResponse({ rows, total: countRows[0].total, page, limit }));
  } catch (err) {
    console.error("GET /api/suppliers error:", err);
    return Response.json({ error: "Failed to load suppliers" }, { status: 500 });
  }
}
