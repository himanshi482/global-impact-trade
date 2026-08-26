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

  const { role, isActive } = body;

  try {
    if (role !== undefined && isActive !== undefined) {
      await query("UPDATE users SET role = ?, is_active = ? WHERE id = ?", [role, isActive, Number(id)]);
    } else if (role !== undefined) {
      await query("UPDATE users SET role = ? WHERE id = ?", [role, Number(id)]);
    } else if (isActive !== undefined) {
      await query("UPDATE users SET is_active = ? WHERE id = ?", [isActive, Number(id)]);
    }

    return Response.json({ message: "User updated" });
  } catch (err) {
    console.error("PUT /api/admin/users/[id] error:", err);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  if (Number(id) === admin.id) {
    return Response.json({ error: "Cannot delete your own admin account" }, { status: 400 });
  }

  try {
    await query("DELETE FROM users WHERE id = ?", [Number(id)]);
    return Response.json({ message: "User deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/users/[id] error:", err);
    return Response.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
