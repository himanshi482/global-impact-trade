import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sameOriginResponse } from "@/lib/csrf";

export async function PUT(request) {
  const csrfError = sameOriginResponse(request);
  if (csrfError) return csrfError;
  const user = await requireUser();
  if (user instanceof Response) return user;
  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;
  await query("UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE", [user.id]);
  return Response.json({ updated: true });
}
