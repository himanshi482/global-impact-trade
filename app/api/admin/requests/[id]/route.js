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

  const { type, status } = body; // type: "contact" | "demo"
  if (!type || !status) {
    return Response.json({ error: "Type and status are required" }, { status: 400 });
  }

  try {
    const table = type === "contact" ? "contact_requests" : "demo_requests";
    await query(`UPDATE ${table} SET status = ? WHERE id = ?`, [status, Number(id)]);
    return Response.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("PUT /api/admin/requests/[id] error:", err);
    return Response.json({ error: "Failed to update request status" }, { status: 500 });
  }
}
