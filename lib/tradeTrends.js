import { query } from "./db";

const GRANULARITIES = {
  monthly: "DATE_FORMAT(shipment_date, '%Y-%m')",
  quarterly: "CONCAT(YEAR(shipment_date), '-Q', QUARTER(shipment_date))",
  yearly: "CAST(YEAR(shipment_date) AS CHAR)",
};

export async function getTradeTrends({ hsCode, country, direction = "export", granularity = "monthly" }) {
  const periodExpression = GRANULARITIES[granularity] || GRANULARITIES.monthly;
  const where = ["shipment_date IS NOT NULL"];
  const params = [];

  if (hsCode) {
    where.push("hs_code LIKE ?");
    params.push(`%${hsCode}%`);
  }
  if (country) {
    if (direction === "import") {
      where.push("origin_country LIKE ?");
      params.push(`%${country}%`);
    } else if (direction === "export") {
      where.push("destination_country LIKE ?");
      params.push(`%${country}%`);
    } else {
      where.push("(origin_country LIKE ? OR destination_country LIKE ?)");
      params.push(`%${country}%`, `%${country}%`);
    }
  }

  const rows = await query(
    `SELECT ${periodExpression} AS period,
            COUNT(*) AS shipmentCount,
            COALESCE(SUM(shipment_value), 0) AS tradeValue,
            COUNT(DISTINCT importer) AS buyerActivity,
            COUNT(DISTINCT exporter) AS supplierActivity
     FROM shipments
     WHERE ${where.join(" AND ")}
     GROUP BY period
     ORDER BY period ASC`,
    params
  );

  if (!rows.length) {
    return { available: false, message: "Insufficient historical data", granularity, trends: [] };
  }

  return {
    available: true,
    message: null,
    granularity,
    trends: rows.map((row) => ({
      period: String(row.period),
      shipmentCount: Number(row.shipmentCount),
      tradeValue: Number(row.tradeValue),
      buyerActivity: Number(row.buyerActivity),
      supplierActivity: Number(row.supplierActivity),
    })),
  };
}
