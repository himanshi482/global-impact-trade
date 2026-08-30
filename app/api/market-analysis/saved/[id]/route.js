import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function DELETE(request, { params }) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId) || numericId < 1) {
    return Response.json({ error: "Invalid analysis ID" }, { status: 400 });
  }

  try {
    const result = await query(
      "DELETE FROM saved_market_analyses WHERE id = ? AND user_id = ?",
      [numericId, user.id]
    );

    if (result.affectedRows === 0) {
      return Response.json(
        { error: "Saved analysis not found or not owned by your account" },
        { status: 404 }
      );
    }

    return Response.json({ message: "Saved market analysis deleted" });
  } catch (err) {
    console.error("DELETE /api/market-analysis/saved/[id] error:", err);
    return Response.json({ error: "Failed to delete saved analysis" }, { status: 500 });
  }
}
