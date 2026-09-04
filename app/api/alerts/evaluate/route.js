import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sameOriginResponse } from "@/lib/csrf";
import { getMarketMetrics, getMarketRisks } from "@/lib/marketIntelligence";
import { calculateOpportunityScore } from "@/lib/marketOpportunity";
import { evaluateAlert } from "@/lib/alertEngine";
import { createNotification } from "@/lib/notifications";

export async function POST(request) {
  const csrfError = sameOriginResponse(request);
  if (csrfError) return csrfError;

  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, "general", String(user.id));
  if (limited) return limited;

  try {
    const alerts = await query(
      "SELECT id, user_id AS userId, name, alert_type AS alertType, criteria, is_active AS isActive FROM market_alerts WHERE user_id = ? AND is_active = TRUE",
      [user.id]
    );

    let triggered = 0;
    const results = [];

    for (const alert of alerts) {
      const criteria = typeof alert.criteria === "string" ? JSON.parse(alert.criteria) : alert.criteria;
      const metrics = await getMarketMetrics({
        hsCode: criteria.hsCode || "010121",
        country: criteria.country || "Germany",
        direction: "export",
      });

      const score = calculateOpportunityScore(metrics);
      const risks = getMarketRisks({ metrics, scoreBreakdown: score.breakdown });
      const riskLevel = risks.some((risk) => risk.severity === "HIGH")
        ? "HIGH"
        : risks.some((risk) => risk.severity === "MEDIUM")
        ? "MEDIUM"
        : "LOW";

      const matches = evaluateAlert(
        { ...alert, criteria, isActive: Boolean(alert.isActive) },
        {
          ...metrics,
          score: score.overall,
          riskLevel,
          hsCode: criteria.hsCode,
          country: criteria.country,
        }
      );

      if (matches) {
        triggered += 1;
        const notification = await createNotification({
          userId: user.id,
          type: "ALERT",
          title: `Market Alert: ${alert.name}`,
          message: `Your alert "${alert.name}" matched current trade criteria (Opportunity Score: ${score.overall}, Risk: ${riskLevel}).`,
          referenceId: alert.id,
        });

        await query(
          "UPDATE market_alerts SET last_triggered_at = NOW() WHERE id = ? AND user_id = ?",
          [alert.id, user.id]
        );

        results.push({
          id: alert.id,
          name: alert.name,
          triggered: true,
          notificationCreated: notification.created,
        });
      } else {
        results.push({
          id: alert.id,
          name: alert.name,
          triggered: false,
        });
      }
    }

    return Response.json({
      evaluated: alerts.length,
      triggered,
      results,
      message:
        alerts.length === 0
          ? "No active alerts found to evaluate."
          : triggered > 0
          ? `Successfully checked ${alerts.length} alert(s) — ${triggered} condition(s) matched and dispatched notifications!`
          : `Evaluated ${alerts.length} active alert(s) — conditions have not yet been met.`,
    });
  } catch (err) {
    console.error("Alert evaluation failed:", err);
    return Response.json({ error: "Failed to evaluate alerts: " + err.message }, { status: 500 });
  }
}
