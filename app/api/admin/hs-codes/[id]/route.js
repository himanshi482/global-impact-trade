import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function PUT(request, { params }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId < 1) {
    return Response.json({ error: "Invalid HS code ID" }, { status: 400 });
  }

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
    // Duplicate-code check excluding current record
    const existing = await query(
      "SELECT id FROM hs_codes WHERE code = ? AND country = ? AND id != ?",
      [trimmedCode, targetCountry, numericId]
    );
    if (existing.length > 0) {
      return Response.json(
        { error: `HS code ${trimmedCode} already exists for ${targetCountry}` },
        { status: 409 }
      );
    }

    const result = await query(
      `UPDATE hs_codes
       SET code = ?, description = ?, chapter = ?, bcd = ?, sws = ?, igst = ?, country = ?
       WHERE id = ?`,
      [
        trimmedCode,
        String(description).trim(),
        hsChapter,
        bcd || null,
        sws || null,
        igst || null,
        targetCountry,
        numericId,
      ]
    );

    if (result.affectedRows === 0) {
      return Response.json({ error: "HS code not found" }, { status: 404 });
    }

    return Response.json({ message: "HS code updated" });
  } catch (err) {
    console.error("PUT /api/admin/hs-codes/[id] error:", err);
    return Response.json(
      { error: "Failed to update HS code" },
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
    return Response.json({ error: "Invalid HS code ID" }, { status: 400 });
  }

  try {
    const result = await query("DELETE FROM hs_codes WHERE id = ?", [
      numericId,
    ]);

    if (result.affectedRows === 0) {
      return Response.json({ error: "HS code not found" }, { status: 404 });
    }

    return Response.json({ message: "HS code deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/hs-codes/[id] error:", err);
    return Response.json(
      { error: "Failed to delete HS code" },
      { status: 500 }
    );
  }
}
