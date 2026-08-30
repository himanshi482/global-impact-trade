import { query } from "./db";
import { calculateOpportunityScore } from "./marketOpportunity";
import { generateMarketRecommendations } from "./marketRecommendation";

/**
 * Aggregates core market metrics directly via MySQL queries.
 */
export async function getMarketMetrics({ hsCode, country, year, direction = "export" }) {
  const buyerWhere = [];
  const buyerParams = [];

  const supplierWhere = [];
  const supplierParams = [];

  const shipmentWhere = [];
  const shipmentParams = [];

  if (hsCode) {
    buyerWhere.push("(b.hs_code LIKE ? OR b.hs_chapter = ?)");
    buyerParams.push(`%${hsCode}%`, hsCode.slice(0, 2));

    supplierWhere.push("(s.hs_code LIKE ? OR s.hs_chapter = ?)");
    supplierParams.push(`%${hsCode}%`, hsCode.slice(0, 2));

    shipmentWhere.push("sh.hs_code LIKE ?");
    shipmentParams.push(`%${hsCode}%`);
  }

  if (country) {
    buyerWhere.push("b.country LIKE ?");
    buyerParams.push(`%${country}%`);

    supplierWhere.push("s.country LIKE ?");
    supplierParams.push(`%${country}%`);

    if (direction === "export") {
      shipmentWhere.push("sh.destination_country LIKE ?");
      shipmentParams.push(`%${country}%`);
    } else if (direction === "import") {
      shipmentWhere.push("sh.origin_country LIKE ?");
      shipmentParams.push(`%${country}%`);
    } else {
      shipmentWhere.push("(sh.origin_country LIKE ? OR sh.destination_country LIKE ?)");
      shipmentParams.push(`%${country}%`, `%${country}%`);
    }
  }

  if (year && year !== "all") {
    shipmentWhere.push("YEAR(sh.shipment_date) = ?");
    shipmentParams.push(Number(year));
  }

  const bWhere = buyerWhere.length ? `WHERE ${buyerWhere.join(" AND ")}` : "";
  const sWhere = supplierWhere.length ? `WHERE ${supplierWhere.join(" AND ")}` : "";
  const shWhere = shipmentWhere.length ? `WHERE ${shipmentWhere.join(" AND ")}` : "";

  const [buyerStats, supplierStats, shipmentStats] = await Promise.all([
    query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) AS verifiedCount
       FROM buyers b ${bWhere}`,
      buyerParams
    ),
    query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) AS verifiedCount
       FROM suppliers s ${sWhere}`,
      supplierParams
    ),
    query(
      `SELECT COUNT(*) AS totalShipments,
              COALESCE(SUM(shipment_value), 0) AS totalValue,
              COALESCE(AVG(shipment_value), 0) AS avgValue,
              COALESCE(SUM(quantity), 0) AS totalQuantity
       FROM shipments sh ${shWhere}`,
      shipmentParams
    ),
  ]);

  const buyerCount = buyerStats[0]?.total || 0;
  const verifiedBuyerCount = Number(buyerStats[0]?.verifiedCount) || 0;
  const supplierCount = supplierStats[0]?.total || 0;
  const verifiedSupplierCount = Number(supplierStats[0]?.verifiedCount) || 0;
  const shipmentCount = shipmentStats[0]?.totalShipments || 0;
  const totalShipmentValue = parseFloat(shipmentStats[0]?.totalValue) || 0;
  const averageShipmentValue = parseFloat(shipmentStats[0]?.avgValue) || 0;
  const totalQuantity = parseFloat(shipmentStats[0]?.totalQuantity) || 0;

  return {
    buyerCount,
    verifiedBuyerCount,
    supplierCount,
    verifiedSupplierCount,
    shipmentCount,
    totalShipmentValue,
    averageShipmentValue,
    totalQuantity,
  };
}

/**
 * Aggregates real historical shipment trends grouped by year/month.
 */
export async function getShipmentTrends({ hsCode, country, direction = "export" }) {
  const where = [];
  const params = [];

  if (hsCode) {
    where.push("hs_code LIKE ?");
    params.push(`%${hsCode}%`);
  }

  if (country) {
    if (direction === "export") {
      where.push("destination_country LIKE ?");
      params.push(`%${country}%`);
    } else if (direction === "import") {
      where.push("origin_country LIKE ?");
      params.push(`%${country}%`);
    } else {
      where.push("(origin_country LIKE ? OR destination_country LIKE ?)");
      params.push(`%${country}%`, `%${country}%`);
    }
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await query(
    `SELECT YEAR(shipment_date) AS year,
            COUNT(*) AS shipmentCount,
            COALESCE(SUM(shipment_value), 0) AS totalValue,
            COALESCE(AVG(shipment_value), 0) AS avgValue,
            COALESCE(SUM(quantity), 0) AS totalQuantity
     FROM shipments
     ${whereClause}
     AND shipment_date IS NOT NULL
     GROUP BY YEAR(shipment_date)
     ORDER BY year ASC`,
    params
  );

  if (!rows || rows.length === 0) {
    return {
      hasData: false,
      message: "Insufficient historical shipment data for seasonal trend analysis in this corridor.",
      trends: [],
    };
  }

  const trends = rows.map((r) => ({
    period: String(r.year),
    shipmentCount: Number(r.shipmentCount),
    totalValue: parseFloat(r.totalValue),
    avgValue: parseFloat(r.avgValue),
    totalQuantity: parseFloat(r.totalQuantity),
  }));

  return {
    hasData: true,
    message: null,
    trends,
  };
}

/**
 * Fetches top buyer entities with server-side contact masking.
 */
export async function getTopBuyers({ hsCode, country, userId, isAdmin = false, limit = 5 }) {
  const where = [];
  const params = [];

  if (hsCode) {
    where.push("(b.hs_code LIKE ? OR b.hs_chapter = ?)");
    params.push(`%${hsCode}%`, hsCode.slice(0, 2));
  }
  if (country) {
    where.push("b.country LIKE ?");
    params.push(`%${country}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await query(
    `SELECT b.id, b.company_name AS companyName, b.country, b.city, b.product,
            b.hs_code AS hsCode, b.import_volume AS importVolume, b.verified,
            b.contact_person AS contactPerson, b.email, b.phone, b.website,
            CASE WHEN ur.id IS NOT NULL THEN TRUE ELSE FALSE END AS isUnlocked
     FROM buyers b
     LEFT JOIN unlock_requests ur ON ur.buyer_id = b.id AND ur.user_id = ? AND ur.status = 'GRANTED'
     ${whereClause}
     ORDER BY b.verified DESC, b.id DESC
     LIMIT ?`,
    [userId || 0, ...params, Number(limit)]
  );

  return rows.map((r) => {
    const unlocked = Boolean(r.isUnlocked) || isAdmin;
    return {
      id: r.id,
      companyName: r.companyName,
      country: r.country,
      city: r.city,
      product: r.product,
      hsCode: r.hsCode,
      importVolume: r.importVolume,
      verified: Boolean(r.verified),
      isUnlocked: unlocked,
      contactPerson: unlocked ? r.contactPerson : null,
      email: unlocked ? r.email : null,
      phone: unlocked ? r.phone : null,
      website: unlocked ? r.website : null,
    };
  });
}

/**
 * Fetches top supplier entities with server-side contact masking.
 */
export async function getTopSuppliers({ hsCode, country, userId, isAdmin = false, limit = 5 }) {
  const where = [];
  const params = [];

  if (hsCode) {
    where.push("(s.hs_code LIKE ? OR s.hs_chapter = ?)");
    params.push(`%${hsCode}%`, hsCode.slice(0, 2));
  }
  if (country) {
    where.push("s.country LIKE ?");
    params.push(`%${country}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await query(
    `SELECT s.id, s.company_name AS companyName, s.country, s.city, s.product,
            s.hs_code AS hsCode, s.export_volume AS exportVolume, s.verified,
            s.contact_person AS contactPerson, s.email, s.phone, s.website,
            CASE WHEN ur.id IS NOT NULL THEN TRUE ELSE FALSE END AS isUnlocked
     FROM suppliers s
     LEFT JOIN unlock_requests ur ON ur.supplier_id = s.id AND ur.user_id = ? AND ur.status = 'GRANTED'
     ${whereClause}
     ORDER BY s.verified DESC, s.id DESC
     LIMIT ?`,
    [userId || 0, ...params, Number(limit)]
  );

  return rows.map((r) => {
    const unlocked = Boolean(r.isUnlocked) || isAdmin;
    return {
      id: r.id,
      companyName: r.companyName,
      country: r.country,
      city: r.city,
      product: r.product,
      hsCode: r.hsCode,
      exportVolume: r.exportVolume,
      verified: Boolean(r.verified),
      isUnlocked: unlocked,
      contactPerson: unlocked ? r.contactPerson : null,
      email: unlocked ? r.email : null,
      phone: unlocked ? r.phone : null,
      website: unlocked ? r.website : null,
    };
  });
}

/**
 * Aggregates granular shipment intelligence (routes, top shippers, top consignees, top ports).
 */
export async function getShipmentIntelligence({ hsCode, country, direction = "export", limit = 5 }) {
  const where = [];
  const params = [];

  if (hsCode) {
    where.push("hs_code LIKE ?");
    params.push(`%${hsCode}%`);
  }

  if (country) {
    if (direction === "export") {
      where.push("destination_country LIKE ?");
      params.push(`%${country}%`);
    } else if (direction === "import") {
      where.push("origin_country LIKE ?");
      params.push(`%${country}%`);
    } else {
      where.push("(origin_country LIKE ? OR destination_country LIKE ?)");
      params.push(`%${country}%`, `%${country}%`);
    }
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [topRoutes, topExporters, topImporters, recentShipments] = await Promise.all([
    query(
      `SELECT origin_country AS origin,
              destination_country AS destination,
              COUNT(*) AS count,
              COALESCE(SUM(shipment_value), 0) AS totalValue
       FROM shipments
       ${whereClause}
       AND origin_country IS NOT NULL AND destination_country IS NOT NULL
       GROUP BY origin_country, destination_country
       ORDER BY count DESC, totalValue DESC
       LIMIT ?`,
      [...params, Number(limit)]
    ),
    query(
      `SELECT exporter,
              COUNT(*) AS count,
              COALESCE(SUM(shipment_value), 0) AS totalValue
       FROM shipments
       ${whereClause}
       AND exporter IS NOT NULL AND exporter != ''
       GROUP BY exporter
       ORDER BY count DESC, totalValue DESC
       LIMIT ?`,
      [...params, Number(limit)]
    ),
    query(
      `SELECT importer,
              COUNT(*) AS count,
              COALESCE(SUM(shipment_value), 0) AS totalValue
       FROM shipments
       ${whereClause}
       AND importer IS NOT NULL AND importer != ''
       GROUP BY importer
       ORDER BY count DESC, totalValue DESC
       LIMIT ?`,
      [...params, Number(limit)]
    ),
    query(
      `SELECT id, exporter, importer, product, hs_code AS hsCode,
              quantity, unit, shipment_value AS shipmentValue,
              origin_country AS originCountry, destination_country AS destinationCountry,
              origin_port AS originPort, destination_port AS destinationPort,
              shipment_date AS shipmentDate
       FROM shipments
       ${whereClause}
       ORDER BY shipment_date DESC, id DESC
       LIMIT ?`,
      [...params, Number(limit)]
    ),
  ]);

  return {
    topRoutes: topRoutes.map((r) => ({
      origin: r.origin,
      destination: r.destination,
      count: Number(r.count),
      totalValue: parseFloat(r.totalValue),
    })),
    topExporters: topExporters.map((e) => ({
      name: e.exporter,
      count: Number(e.count),
      totalValue: parseFloat(e.totalValue),
    })),
    topImporters: topImporters.map((i) => ({
      name: i.importer,
      count: Number(i.count),
      totalValue: parseFloat(i.totalValue),
    })),
    recentShipments: recentShipments.map((s) => ({
      id: s.id,
      exporter: s.exporter,
      importer: s.importer,
      product: s.product,
      hsCode: s.hsCode,
      quantity: s.quantity,
      unit: s.unit,
      shipmentValue: s.shipmentValue,
      originCountry: s.originCountry,
      destinationCountry: s.destinationCountry,
      originPort: s.originPort,
      destinationPort: s.destinationPort,
      shipmentDate: s.shipmentDate,
    })),
  };
}

/**
 * Derives concrete, rule-based market risks from real data metrics.
 */
export function getMarketRisks({ metrics, scoreBreakdown }) {
  const risks = [];

  if (metrics.buyerCount === 0) {
    risks.push({
      severity: "HIGH",
      title: "Unconfirmed Direct Buyer Demand",
      detail: "No active buyer entities currently cataloged in this country corridor.",
    });
  } else if (metrics.buyerCount <= 2) {
    risks.push({
      severity: "MEDIUM",
      title: "Concentrated Buyer Base",
      detail: `Only ${metrics.buyerCount} active buyer entity/entities recorded. High reliance on limited accounts.`,
    });
  }

  if (metrics.shipmentCount === 0) {
    risks.push({
      severity: "MEDIUM",
      title: "Uncharted Freight History",
      detail: "Zero verified bills of lading logged in database for this specific route.",
    });
  }

  if (metrics.supplierCount >= 5 && metrics.supplierCount > metrics.buyerCount * 2) {
    risks.push({
      severity: "HIGH",
      title: "High Supplier Saturation",
      detail: "Significant competing supplier density may squeeze export margins.",
    });
  }

  if (scoreBreakdown.dataConfidence < 50) {
    risks.push({
      severity: "LOW",
      title: "Limited Sample Depth",
      detail: "Statistical scores are generated from initial seed dataset coverage.",
    });
  }

  if (risks.length === 0) {
    risks.push({
      severity: "LOW",
      title: "Favorable Trading Climate",
      detail: "No structural trade bottlenecks or severe competitive imbalances identified.",
    });
  }

  return risks;
}

/**
 * Compares 2 to 5 countries for a given HS code, ranked by Opportunity Score.
 */
export async function compareCountries({ hsCode, countries = [] }) {
  const cleanedCountries = Array.from(
    new Set(
      countries
        .filter((c) => typeof c === "string" && c.trim().length > 0)
        .map((c) => c.trim())
    )
  ).slice(0, 5);

  if (cleanedCountries.length < 2) {
    throw new Error("Country comparison requires between 2 and 5 distinct countries.");
  }

  const results = await Promise.all(
    cleanedCountries.map(async (country) => {
      const metrics = await getMarketMetrics({ hsCode, country, direction: "export" });
      const score = calculateOpportunityScore({
        buyerCount: metrics.buyerCount,
        verifiedBuyerCount: metrics.verifiedBuyerCount,
        supplierCount: metrics.supplierCount,
        shipmentCount: metrics.shipmentCount,
        totalShipmentValue: metrics.totalShipmentValue,
        averageShipmentValue: metrics.averageShipmentValue,
      });

      return {
        country,
        metrics,
        score,
      };
    })
  );

  // Sort descending by Opportunity Score
  results.sort((a, b) => b.score.overall - a.score.overall);

  return results;
}

/**
 * Finds top market opportunities across all available countries for a given HS code/product.
 */
export async function findBestMarkets({ hsCode, product = null, limit = 6 }) {
  // Discover countries that have either buyers or shipments for this HS Code / Product
  const where = [];
  const params = [];

  if (hsCode) {
    where.push("(hs_code LIKE ? OR hs_chapter = ?)");
    params.push(`%${hsCode}%`, hsCode.slice(0, 2));
  }
  if (product) {
    where.push("product LIKE ?");
    params.push(`%${product}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [buyerCountries, shipmentCountries] = await Promise.all([
    query(
      `SELECT DISTINCT country FROM buyers ${whereClause} AND country IS NOT NULL AND country != ''`,
      params
    ),
    query(
      `SELECT DISTINCT destination_country AS country FROM shipments ${whereClause} AND destination_country IS NOT NULL AND destination_country != ''`,
      params
    ),
  ]);

  const countrySet = new Set([
    ...buyerCountries.map((r) => r.country),
    ...shipmentCountries.map((r) => r.country),
  ]);

  if (countrySet.size === 0) {
    return [];
  }

  const candidateCountries = Array.from(countrySet);

  const marketRankings = await Promise.all(
    candidateCountries.map(async (country) => {
      const metrics = await getMarketMetrics({ hsCode, country, direction: "export" });
      const score = calculateOpportunityScore({
        buyerCount: metrics.buyerCount,
        verifiedBuyerCount: metrics.verifiedBuyerCount,
        supplierCount: metrics.supplierCount,
        shipmentCount: metrics.shipmentCount,
        totalShipmentValue: metrics.totalShipmentValue,
        averageShipmentValue: metrics.averageShipmentValue,
      });

      return {
        country,
        metrics,
        score,
      };
    })
  );

  marketRankings.sort((a, b) => b.score.overall - a.score.overall);

  return marketRankings.slice(0, Number(limit));
}

/**
 * Assembles the complete unified Market Intelligence payload.
 */
export async function getUnifiedMarketAnalysis({
  hsCode,
  country,
  year = "all",
  direction = "export",
  userId,
  userRole = "USER",
}) {
  const isAdmin = userRole === "ADMIN";

  const [metrics, trendResult, topBuyers, topSuppliers, shipmentIntel] = await Promise.all([
    getMarketMetrics({ hsCode, country, year, direction }),
    getShipmentTrends({ hsCode, country, direction }),
    getTopBuyers({ hsCode, country, userId, isAdmin, limit: 5 }),
    getTopSuppliers({ hsCode, country, userId, isAdmin, limit: 5 }),
    getShipmentIntelligence({ hsCode, country, direction, limit: 5 }),
  ]);

  const score = calculateOpportunityScore({
    buyerCount: metrics.buyerCount,
    verifiedBuyerCount: metrics.verifiedBuyerCount,
    supplierCount: metrics.supplierCount,
    shipmentCount: metrics.shipmentCount,
    totalShipmentValue: metrics.totalShipmentValue,
    averageShipmentValue: metrics.averageShipmentValue,
    historicalYears: trendResult.trends.length,
  });

  const risks = getMarketRisks({ metrics, scoreBreakdown: score.breakdown });
  const recommendations = generateMarketRecommendations({
    overallScore: score.overall,
    buyerCount: metrics.buyerCount,
    verifiedBuyerCount: metrics.verifiedBuyerCount,
    supplierCount: metrics.supplierCount,
    shipmentCount: metrics.shipmentCount,
    totalShipmentValue: metrics.totalShipmentValue,
    hsCode,
    country,
  });

  const dataQuality = {
    datasetType: "Demo dataset — GlobeBridge Internal Trade Repository",
    totalRecordsAnalyzed: metrics.buyerCount + metrics.supplierCount + metrics.shipmentCount,
    isLiveFeed: false,
    confidenceLevel: `${score.breakdown.dataConfidence}%`,
    lastRefreshed: new Date().toISOString(),
  };

  return {
    market: {
      hsCode: hsCode || "All Commodities",
      country: country || "Global Aggregation",
      year: year || "All Periods",
      direction,
    },
    metrics,
    trend: trendResult,
    score,
    risks,
    recommendations,
    topBuyers,
    topSuppliers,
    shipmentIntelligence: shipmentIntel,
    dataQuality,
  };
}
