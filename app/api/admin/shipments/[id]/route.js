import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function PUT(request, { params }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId < 1) {
    return Response.json({ error: "Invalid shipment ID" }, { status: 400 });
  }

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
    return Response.json({ error: "product is required" }, { status: 400 });
  }

  try {
    const result = await query(
      `UPDATE shipments
       SET exporter = ?, importer = ?, product = ?, hs_code = ?,
           quantity = ?, unit = ?, shipment_value = ?,
           origin_country = ?, destination_country = ?,
           origin_port = ?, destination_port = ?, shipment_date = ?
       WHERE id = ?`,
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
        numericId,
      ]
    );

    if (result.affectedRows === 0) {
      return Response.json({ error: "Shipment not found" }, { status: 404 });
    }

    return Response.json({ message: "Shipment updated" });
  } catch (err) {
    console.error("PUT /api/admin/shipments/[id] error:", err);
    return Response.json(
      { error: "Failed to update shipment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId < 1) {
    return Response.json({ error: "Invalid shipment ID" }, { status: 400 });
  }

  try {
    const result = await query("DELETE FROM shipments WHERE id = ?", [
      numericId,
    ]);

    if (result.affectedRows === 0) {
      return Response.json({ error: "Shipment not found" }, { status: 404 });
    }

    return Response.json({ message: "Shipment deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/shipments/[id] error:", err);
    return Response.json(
      { error: "Failed to delete shipment" },
      { status: 500 }
    );
  }
}
