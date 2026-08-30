import { query } from "./db";

// Quota per plan, matching the tiers on /plans-pricing:
//   FREE (Free Explorer Trial) -> 10 verified entity profile views
//   GROWTH (Growth / Exim Cloud) -> 50 verified company profile views
//   CONNECT (Connect Pro / Enterprise) -> 200 full profile views / mo
//   CONQUER (Conquer Global Suite) -> unlimited
export const PLAN_LIMITS = {
  FREE: 10,
  GROWTH: 50,
  CONNECT: 200,
  CONQUER: 999999,
};

/**
 * Checks remaining contact unlock quota for a user based on active subscription.
 * @param {number} userId
 */
export async function getRemainingUnlocks(userId) {
  const [subRows, countRows] = await Promise.all([
    query(
      "SELECT plan FROM subscriptions WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1",
      [userId]
    ),
    query("SELECT COUNT(*) AS total FROM unlock_requests WHERE user_id = ?", [userId]),
  ]);

  const plan = subRows[0]?.plan || "FREE";
  const maxAllowed = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const used = countRows[0]?.total || 0;
  const remaining = Math.max(0, maxAllowed - used);

  return {
    plan,
    maxAllowed,
    used,
    remaining,
    isUnlimited: maxAllowed >= 999999,
  };
}
