import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PLAN_LIMITS } from "@/lib/limits";

const VALID_PLANS = Object.keys(PLAN_LIMITS); // ["FREE", "GROWTH", "CONNECT", "CONQUER"]
const VALID_STATUSES = ["ACTIVE", "EXPIRED", "CANCELLED"];

// No payment integration (by design, per spec) — this is the only way a
// user's plan changes: an admin sets it manually here.
export async function PUT(request, { params }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { userId } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { plan, status, endDate } = body;

  if (plan && !VALID_PLANS.includes(plan)) {
    return Response.json({ error: `plan must be one of: ${VALID_PLANS.join(", ")}` }, { status: 400 });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return Response.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  try {
    const existing = await query(
      "SELECT id FROM subscriptions WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1",
      [Number(userId)]
    );

    if (existing.length > 0) {
      await query(
        `UPDATE subscriptions
         SET plan = COALESCE(?, plan), status = COALESCE(?, status), end_date = COALESCE(?, end_date)
         WHERE id = ?`,
        [plan || null, status || null, endDate || null, existing[0].id]
      );
    } else {
      await query(
        `INSERT INTO subscriptions (user_id, plan, status, start_date, end_date)
         VALUES (?, ?, ?, CURDATE(), ?)`,
        [Number(userId), plan || "FREE", status || "ACTIVE", endDate || null]
      );
    }

    return Response.json({ message: "Subscription updated" });
  } catch (err) {
    console.error("PUT /api/admin/subscriptions/[userId] error:", err);
    return Response.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
