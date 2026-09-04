import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { getApiMetrics } from "@/lib/apiObservability";

const ranges = { "7": 7, "30": 30, "90": 90 };

export async function GET(request) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof Response) return admin;

    const limited = rateLimitResponse(request, "general", `admin:${admin.id}`);
    if (limited) return limited;

    const days = ranges[new URL(request.url).searchParams.get("range")] || null;
    const clause = days ? " WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)" : "";

    const [
      users,
      activeUsers,
      subscriptions,
      subPlans,
      analyses,
      plans,
      leads,
      leadTypes,
      unlocks,
      unlockStatuses,
      alerts,
      notifications,
    ] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM users${clause}`, days ? [days] : []).catch(() => [{ total: 0 }]),
      query(
        `SELECT COUNT(*) AS total FROM users WHERE is_active = TRUE${days ? " AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)" : ""}`,
        days ? [days] : []
      ).catch(() => [{ total: 0 }]),
      query(
        `SELECT COUNT(*) AS total FROM subscriptions WHERE status = 'ACTIVE'${days ? " AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)" : ""}`,
        days ? [days] : []
      ).catch(() => [{ total: 0 }]),
      query(
        `SELECT plan, COUNT(*) AS count FROM subscriptions WHERE status = 'ACTIVE' GROUP BY plan`
      ).catch(() => []),
      query(`SELECT COUNT(*) AS total FROM saved_market_analyses${clause}`, days ? [days] : []).catch(() => [{ total: 0 }]),
      query(`SELECT COUNT(*) AS total FROM saved_export_plans${clause}`, days ? [days] : []).catch(() => [{ total: 0 }]),
      query(`SELECT status, COUNT(*) AS total FROM saved_leads${clause} GROUP BY status`, days ? [days] : []).catch(() => []),
      query(`SELECT entity_type, COUNT(*) AS total FROM saved_leads${clause} GROUP BY entity_type`, days ? [days] : []).catch(() => []),
      query(`SELECT COUNT(*) AS total FROM unlock_requests${clause}`, days ? [days] : []).catch(() => [{ total: 0 }]),
      query(`SELECT status, COUNT(*) AS total FROM unlock_requests${clause} GROUP BY status`, days ? [days] : []).catch(() => []),
      query(
        `SELECT COUNT(*) AS total, 
                SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) AS active, 
                SUM(CASE WHEN last_triggered_at IS NOT NULL THEN 1 ELSE 0 END) AS triggered 
         FROM market_alerts${clause}`,
        days ? [days] : []
      ).catch(() => [{ total: 0, active: 0, triggered: 0 }]),
      query(
        `SELECT COUNT(*) AS total, 
                SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) AS unread 
         FROM notifications${clause}`,
        days ? [days] : []
      ).catch(() => [{ total: 0, unread: 0 }]),
    ]);

    const apiMetrics = getApiMetrics();
    const avgResponseTimeMs = apiMetrics.requests
      ? Math.round(apiMetrics.totalResponseTimeMs / apiMetrics.requests)
      : 0;

    const leadsByStatus = Object.fromEntries(
      leads.map((row) => [row.status, Number(row.total || 0)])
    );
    const leadsByEntity = Object.fromEntries(
      leadTypes.map((row) => [row.entity_type, Number(row.total || 0)])
    );
    const subscriptionsByPlan = Object.fromEntries(
      subPlans.map((row) => [row.plan, Number(row.count || 0)])
    );
    const unlocksByStatus = Object.fromEntries(
      unlockStatuses.map((row) => [row.status, Number(row.total || 0)])
    );

    const totalLeadsCount = leads.reduce((sum, row) => sum + Number(row.total || 0), 0);

    return Response.json({
      range: days ? `${days}d` : "all",
      metrics: {
        users: Number(users[0]?.total || 0),
        activeUsers: Number(activeUsers[0]?.total || 0),
        activeSubscriptions: Number(subscriptions[0]?.total || 0),
        subscriptionsByPlan,
        savedAnalyses: Number(analyses[0]?.total || 0),
        savedExportPlans: Number(plans[0]?.total || 0),
        totalLeads: totalLeadsCount,
        leadsByStatus,
        leadsByEntity,
        unlocks: Number(unlocks[0]?.total || 0),
        unlocksByStatus,
        alerts: {
          total: Number(alerts[0]?.total || 0),
          active: Number(alerts[0]?.active || 0),
          triggered: Number(alerts[0]?.triggered || 0),
        },
        notifications: {
          total: Number(notifications[0]?.total || 0),
          unread: Number(notifications[0]?.unread || 0),
        },
        usage: {
          savedMarketAnalyses: Number(analyses[0]?.total || 0),
          exportPlansGenerated: Number(plans[0]?.total || 0),
          pipelineLeadsManaged: totalLeadsCount,
          contactUnlocksProcessed: Number(unlocks[0]?.total || 0),
          automatedAlertsActive: Number(alerts[0]?.active || 0),
        },
        api: {
          ...apiMetrics,
          avgResponseTimeMs,
        },
      },
    });
  } catch (err) {
    console.error("Admin analytics error:", err);
    return Response.json({ error: "Failed to compute analytics: " + err.message }, { status: 500 });
  }
}

