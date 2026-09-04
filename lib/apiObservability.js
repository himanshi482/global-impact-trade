const metrics = globalThis.__globeBridgeApiMetrics || {
  requests: 0,
  statuses: {},
  errors: 0,
  rateLimitEvents: 0,
  totalResponseTimeMs: 0,
};

globalThis.__globeBridgeApiMetrics = metrics;

export function recordApiMetric({ status, durationMs, error = false, rateLimited = false }) {
  metrics.requests += 1;
  metrics.statuses[status] = (metrics.statuses[status] || 0) + 1;
  metrics.totalResponseTimeMs += Number(durationMs) || 0;
  if (error) metrics.errors += 1;
  if (rateLimited) metrics.rateLimitEvents += 1;
}

export function getApiMetrics() {
  return { ...metrics, statuses: { ...metrics.statuses } };
}