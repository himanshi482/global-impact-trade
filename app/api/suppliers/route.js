import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parsePagination, parseSort, paginatedResponse } from "@/lib/http";

const SORTABLE = {
  companyName: "s.company_name",
  country: "s.country",
  createdAt: "s.created_at",
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
    where.push("s.product LIKE ?");
    params.push(`%${product}%`);
  }
  if (country) {
    where.push("s.country LIKE ?");
    params.push(`%${country}%`);
  }
  if (hsCode) {
    where.push("s.hs_code = ?");
    params.push(hsCode);
  }
  if (hsChapter) {
    where.push("s.hs_chapter = ?");
    params.push(hsChapter);
  }
  if (q) {
    where.push("(s.company_name LIKE ? OR s.product LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const isAdmin = user.role === "ADMIN";

    const [rows, countRows] = await Promise.all([
      query(
        `SELECT s.id, s.company_name AS companyName, s.country, s.city, s.product,
                s.hs_code AS hsCode, s.hs_chapter AS hsChapter, s.export_volume AS exportVolume,
                s.verified, s.created_at AS createdAt,
                s.contact_person AS contactPerson, s.email, s.phone, s.website,
                CASE WHEN ur.id IS NOT NULL THEN TRUE ELSE FALSE END AS isUnlocked
         FROM suppliers s
         LEFT JOIN unlock_requests ur ON ur.supplier_id = s.id AND ur.user_id = ? AND ur.status = 'GRANTED'
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [user.id, ...params, limit, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM suppliers s ${whereClause}`, params),
    ]);

    const sanitizedRows = rows.map((r) => {
      const unlocked = Boolean(r.isUnlocked) || isAdmin;
      return {
        id: r.id,
        companyName: r.companyName,
        country: r.country,
        city: r.city,
        product: r.product,
        hsCode: r.hsCode,
        hsChapter: r.hsChapter,
        exportVolume: r.exportVolume,
        verified: r.verified,
        createdAt: r.createdAt,
        isUnlocked: unlocked,
        contactPerson: unlocked ? r.contactPerson : null,
        email: unlocked ? r.email : null,
        phone: unlocked ? r.phone : null,
        website: unlocked ? r.website : null,
      };
    });

    return Response.json(paginatedResponse({ rows: sanitizedRows, total: countRows[0].total, page, limit }));
  } catch (err) {
    console.error("GET /api/suppliers error:", err);
    return Response.json({ error: "Failed to load suppliers" }, { status: 500 });
  }
}
