import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parsePagination, parseSort, paginatedResponse } from "@/lib/http";

const SORTABLE = {
  shipmentDate: "shipment_date",
  shipmentValue: "shipment_value",
  createdAt: "created_at",
};

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = parsePagination(searchParams);
  const orderBy = parseSort(searchParams, SORTABLE, "shipmentDate:desc");

  const product = searchParams.get("product");
  const hsCode = searchParams.get("hsCode");
  const originCountry = searchParams.get("originCountry");
  const destinationCountry = searchParams.get("destinationCountry");

  const where = [];
  const params = [];

  if (product) {
    where.push("product LIKE ?");
    params.push(`%${product}%`);
  }
  if (hsCode) {
    where.push("hs_code = ?");
    params.push(hsCode);
  }
  if (originCountry) {
    where.push("origin_country LIKE ?");
    params.push(`%${originCountry}%`);
  }
  if (destinationCountry) {
    where.push("destination_country LIKE ?");
    params.push(`%${destinationCountry}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows, countRows] = await Promise.all([
      query(
        `SELECT id, exporter, importer, product, hs_code AS hsCode, quantity, unit,
                shipment_value AS shipmentValue, origin_country AS originCountry,
                destination_country AS destinationCountry, origin_port AS originPort,
                destination_port AS destinationPort, shipment_date AS shipmentDate
         FROM shipments
         ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM shipments ${whereClause}`, params),
    ]);

    return Response.json(paginatedResponse({ rows, total: countRows[0].total, page, limit }));
  } catch (err) {
    console.error("GET /api/shipments error:", err);
    return Response.json({ error: "Failed to load shipments" }, { status: 500 });
  }
}
