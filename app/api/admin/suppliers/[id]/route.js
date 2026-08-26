import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function PUT(request, { params }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { company_name, country, city, product, hs_code, export_volume, verified } = body;

  try {
    await query(
      `UPDATE suppliers
       SET company_name = ?, country = ?, city = ?, product = ?, hs_code = ?, hs_chapter = ?, export_volume = ?, verified = ?
       WHERE id = ?`,
      [
        company_name,
        country,
        city,
        product,
        hs_code,
        hs_code ? hs_code.slice(0, 2) : null,
        export_volume,
        verified ? 1 : 0,
        Number(id),
      ]
    );

    return Response.json({ message: "Supplier updated" });
  } catch (err) {
    console.error("PUT /api/admin/suppliers/[id] error:", err);
    return Response.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;

  try {
    await query("DELETE FROM suppliers WHERE id = ?", [Number(id)]);
    return Response.json({ message: "Supplier deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/suppliers/[id] error:", err);
    return Response.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
