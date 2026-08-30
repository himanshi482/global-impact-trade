import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { parsePagination, parseSort, paginatedResponse } from "@/lib/http";

const SORT_COLUMNS = {
  id: "id",
  product: "product",
  hsCode: "hs_code",
  originCountry: "origin_country",
  destinationCountry: "destination_country",
  shipmentDate: "shipment_date",
  shipmentValue: "shipment_value",
  createdAt: "created_at",
};

export async function GET(request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const orderBy = parseSort(searchParams, SORT_COLUMNS, "id:desc");

    const conditions = [];
    const params = [];

    const q = searchParams.get("q")?.trim();
    if (q) {
      conditions.push(
        "(product LIKE ? OR exporter LIKE ? OR importer LIKE ? OR hs_code LIKE ?)"
      );
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    const product = searchParams.get("product")?.trim();
    if (product) {
      conditions.push("product LIKE ?");
      params.push(`%${product}%`);
    }

    const hsCode = searchParams.get("hsCode")?.trim();
    if (hsCode) {
      conditions.push("hs_code LIKE ?");
      params.push(`%${hsCode}%`);
    }

    const originCountry = searchParams.get("originCountry")?.trim();
    if (originCountry) {
      conditions.push("origin_country = ?");
      params.push(originCountry);
    }

    const destinationCountry = searchParams.get("destinationCountry")?.trim();
    if (destinationCountry) {
      conditions.push("destination_country = ?");
      params.push(destinationCountry);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const countRows = await query(
      `SELECT COUNT(*) AS total FROM shipments ${where}`,
      params
    );
    const total = countRows[0].total;

    const rows = await query(
      `SELECT id, exporter, importer, product, hs_code, quantity, unit,
              shipment_value, origin_country, destination_country,
              origin_port, destination_port, shipment_date, created_at
       FROM shipments ${where}
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return Response.json(paginatedResponse({ rows, total, page, limit }));
  } catch (err) {
    console.error("GET /api/admin/shipments error:", err);
    return Response.json(
      { error: "Failed to load shipments" },
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

  const {
    exporter,
    importer,
    product,
    hs_code,
    quantity,
    unit,
    shipment_value,
    origin_country,
    destination_country,
    origin_port,
    destination_port,
    shipment_date,
  } = body;

  if (!product) {
    return Response.json(
      { error: "product is required" },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `INSERT INTO shipments
        (exporter, importer, product, hs_code, quantity, unit,
         shipment_value, origin_country, destination_country,
         origin_port, destination_port, shipment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        exporter || null,
        importer || null,
        product,
        hs_code || null,
        quantity != null ? Number(quantity) : null,
        unit || null,
        shipment_value != null ? Number(shipment_value) : null,
        origin_country || null,
        destination_country || null,
        origin_port || null,
        destination_port || null,
        shipment_date || null,
      ]
    );

    return Response.json(
      { id: result.insertId, message: "Shipment created" },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/admin/shipments error:", err);
    return Response.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
