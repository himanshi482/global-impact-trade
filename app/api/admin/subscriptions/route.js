import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PLAN_LIMITS, getRemainingUnlocks } from "@/lib/limits";

export async function GET(request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  try {
    const users = await query(
      `SELECT u.id, u.name, u.email, s.plan, s.status, s.start_date AS startDate, s.end_date AS endDate
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'ACTIVE'
       ORDER BY u.created_at DESC`
    );

    // Attach live unlock-quota usage for each user so admins can see who's
    // close to their limit without opening each profile individually.
    const withQuota = await Promise.all(
      users.map(async (u) => {
        const quota = await getRemainingUnlocks(u.id);
        return { ...u, plan: u.plan || "FREE", quota };
      })
    );

    return Response.json({ data: withQuota, planLimits: PLAN_LIMITS });
  } catch (err) {
    console.error("GET /api/admin/subscriptions error:", err);
    return Response.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}
