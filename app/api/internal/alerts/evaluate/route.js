import { query } from "@/lib/db";
import { getMarketMetrics, getMarketRisks } from "@/lib/marketIntelligence";
import { calculateOpportunityScore } from "@/lib/marketOpportunity";
import { evaluateAlert } from "@/lib/alertEngine";
import { createNotification } from "@/lib/notifications";

export async function POST(request) {
  const expected = process.env.ALERT_CRON_SECRET;
  if (!expected || request.headers.get("x-alert-cron-secret") !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await query("SELECT id, user_id AS userId, name, alert_type AS alertType, criteria, is_active AS isActive FROM market_alerts WHERE is_active = TRUE");
  let triggered = 0;
  for (const alert of alerts) {
    const criteria = typeof alert.criteria === "string" ? JSON.parse(alert.criteria) : alert.criteria;
    const metrics = await getMarketMetrics({ hsCode: criteria.hsCode, country: criteria.country, direction: "export" });
    const score = calculateOpportunityScore(metrics);
    const risks = getMarketRisks({ metrics, scoreBreakdown: score.breakdown });
    const riskLevel = risks.some((risk) => risk.severity === "HIGH") ? "HIGH" : risks.some((risk) => risk.severity === "MEDIUM") ? "MEDIUM" : "LOW";
    const matches = evaluateAlert({ ...alert, criteria, isActive: Boolean(alert.isActive) }, { ...metrics, score: score.overall, riskLevel, hsCode: criteria.hsCode, country: criteria.country });
    if (!matches) continue;
    const notification = await createNotification({ userId: alert.userId, type: "ALERT", title: "Market alert triggered", message: `${alert.name} matched current database-backed trade intelligence.`, referenceId: alert.id });
    if (notification.created) triggered += 1;
    await query("UPDATE market_alerts SET last_triggered_at = NOW() WHERE id = ? AND user_id = ?", [alert.id, alert.userId]);
  }

  const dueLeads = await query("SELECT id, user_id AS userId FROM saved_leads WHERE next_follow_up_at IS NOT NULL AND next_follow_up_at <= NOW()");
  for (const lead of dueLeads) {
    await createNotification({ userId: lead.userId, type: "LEAD", title: "Lead follow-up due", message: "A lead in your pipeline is due for follow-up.", referenceId: lead.id });
  }
  return Response.json({ evaluated: alerts.length, triggered, followUps: dueLeads.length });
}