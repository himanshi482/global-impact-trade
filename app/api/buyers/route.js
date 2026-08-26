import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parsePagination, parseSort, paginatedResponse } from "@/lib/http";

const SORTABLE = {
  companyName: "b.company_name",
  country: "b.country",
  createdAt: "b.created_at",
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
    where.push("b.product LIKE ?");
    params.push(`%${product}%`);
  }
  if (country) {
    where.push("b.country LIKE ?");
    params.push(`%${country}%`);
  }
  if (hsCode) {
    where.push("b.hs_code = ?");
    params.push(hsCode);
  }
  if (hsChapter) {
    where.push("b.hs_chapter = ?");
    params.push(hsChapter);
  }
  if (q) {
    where.push("(b.company_name LIKE ? OR b.product LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const isAdmin = user.role === "ADMIN";

    const [rows, countRows] = await Promise.all([
      query(
        `SELECT b.id, b.company_name AS companyName, b.country, b.city, b.product,
                b.hs_code AS hsCode, b.hs_chapter AS hsChapter, b.import_volume AS importVolume,
                b.verified, b.created_at AS createdAt,
                b.contact_person AS contactPerson, b.email, b.phone, b.website,
                CASE WHEN ur.id IS NOT NULL THEN TRUE ELSE FALSE END AS isUnlocked
         FROM buyers b
         LEFT JOIN unlock_requests ur ON ur.buyer_id = b.id AND ur.user_id = ? AND ur.status = 'GRANTED'
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [user.id, ...params, limit, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM buyers b ${whereClause}`, params),
    ]);

    // Mask private contact info if not unlocked and not admin
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
        importVolume: r.importVolume,
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
    console.error("GET /api/buyers error:", err);
    return Response.json({ error: "Failed to load buyers" }, { status: 500 });
  }
}
