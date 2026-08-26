import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  try {
    const rows = await query("SELECT * FROM suppliers ORDER BY id DESC LIMIT 200");
    return Response.json({ data: rows });
  } catch (err) {
    console.error("GET /api/admin/suppliers error:", err);
    return Response.json({ error: "Failed to load suppliers" }, { status: 500 });
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

  const { company_name, country, city, product, hs_code, export_volume, verified } = body;
  if (!company_name || !product) {
    return Response.json({ error: "company_name and product are required" }, { status: 400 });
  }

  try {
    const result = await query(
      `INSERT INTO suppliers (company_name, country, city, product, hs_code, hs_chapter, export_volume, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_name,
        country || "India",
        city || null,
        product,
        hs_code || null,
        hs_code ? hs_code.slice(0, 2) : null,
        export_volume || null,
        verified ? 1 : 0,
      ]
    );

    return Response.json({ id: result.insertId, message: "Supplier created" }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/suppliers error:", err);
    return Response.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
