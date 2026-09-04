const ALERT_TYPES = new Set([
  "HS_CODE",
  "COUNTRY",
  "OPPORTUNITY_SCORE",
  "BUYER_ACTIVITY",
  "SHIPMENT_ACTIVITY",
  "RISK_LEVEL",
]);

export function evaluateAlert(alert, metrics) {
  if (!alert?.isActive || !ALERT_TYPES.has(alert.alertType)) return false;
  const criteria = alert.criteria || {};
  if (alert.alertType === "OPPORTUNITY_SCORE") return Number(metrics.score) >= Number(criteria.threshold);
  if (alert.alertType === "BUYER_ACTIVITY") return Number(metrics.buyerCount) >= Number(criteria.threshold);
  if (alert.alertType === "SHIPMENT_ACTIVITY") return Number(metrics.shipmentCount) >= Number(criteria.threshold);
  if (alert.alertType === "RISK_LEVEL") return String(metrics.riskLevel).toUpperCase() === String(criteria.level).toUpperCase();
  if (alert.alertType === "HS_CODE") return String(metrics.hsCode || "") === String(criteria.hsCode || "");
  if (alert.alertType === "COUNTRY") return String(metrics.country || "").toLowerCase() === String(criteria.country || "").toLowerCase();
  return false;
}
