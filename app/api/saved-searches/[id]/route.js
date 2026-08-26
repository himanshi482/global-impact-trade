import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function DELETE(request, { params }) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  if (!id) {
    return Response.json({ error: "Missing ID" }, { status: 400 });
  }

  try {
    const result = await query(
      "DELETE FROM saved_searches WHERE id = ? AND user_id = ?",
      [Number(id), user.id]
    );

    if (result.affectedRows === 0) {
      return Response.json({ error: "Saved search not found or unauthorized" }, { status: 404 });
    }

    return Response.json({ message: "Saved search removed" });
  } catch (err) {
    console.error("DELETE /api/saved-searches/[id] error:", err);
    return Response.json({ error: "Failed to delete saved search" }, { status: 500 });
  }
}
