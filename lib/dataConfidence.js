const LEVELS = ["LOW", "MEDIUM", "HIGH"];

export function createDataConfidence({
  available,
  source = "database",
  freshness = null,
  sampleSize = 0,
  limitations = [],
}) {
  if (!available) {
    return {
      available: false,
      confidence: 0,
      level: "LOW",
      source,
      freshness,
      limitations: [...new Set(["Data is unavailable", ...limitations])],
    };
  }

  const confidence = Math.max(0, Math.min(100, sampleSize >= 25 ? 90 : sampleSize >= 10 ? 70 : 40));
  const level = LEVELS[confidence >= 80 ? 2 : confidence >= 50 ? 1 : 0];
  return { available: true, confidence, level, source, freshness, limitations };
}

export function confidenceFromMetrics(metrics, options = {}) {
  const sampleSize = Number(metrics?.shipmentCount || 0) + Number(metrics?.buyerCount || 0);
  return createDataConfidence({
    available: sampleSize > 0,
    sampleSize,
    ...options,
  });
}
