import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sameOriginResponse } from "@/lib/csrf";

export async function DELETE(request, { params }) {
  const csrfError = sameOriginResponse(request);
  if (csrfError) return csrfError;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;

  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) {
    return Response.json({ error: "Invalid notification ID" }, { status: 400 });
  }

  const result = await query(
    "DELETE FROM notifications WHERE id = ? AND user_id = ?",
    [Number(id), user.id]
  );

  if (!result.affectedRows) {
    return Response.json({ error: "Notification not found" }, { status: 404 });
  }

  return Response.json({ deleted: true });
}
