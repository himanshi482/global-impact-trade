import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sameOriginResponse } from "@/lib/csrf";

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;
  const rows = await query(
    "SELECT id, type, title, message, reference_id AS referenceId, is_read AS isRead, created_at AS createdAt FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
    [user.id]
  );
  return Response.json({
    notifications: rows.map((row) => ({ ...row, isRead: Boolean(row.isRead) })),
  });
}

export async function DELETE(request) {
  const csrfError = sameOriginResponse(request);
  if (csrfError) return csrfError;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") || "read";

  if (scope === "all") {
    await query("DELETE FROM notifications WHERE user_id = ?", [user.id]);
  } else {
    await query("DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE", [user.id]);
  }

  return Response.json({ deleted: true });
}

