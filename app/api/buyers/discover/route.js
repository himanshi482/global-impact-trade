// app/api/buyers/discover/route.js
// Stage 3 Phase 2 — GET /api/buyers/discover

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { rateLimitResponse } from '@/lib/rateLimit';
import { computeLeadScore } from '@/lib/leadScoring';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const SORT_MAP = {
  relevance: 'IFNULL(sh.shipment_count, 0) DESC, IFNULL(sh.total_shipment_value, 0) DESC',
  leadScore: null, // computed in JS after fetch; see below
  activity: 'IFNULL(sh.shipment_count, 0) DESC',
  value: 'IFNULL(sh.total_shipment_value, 0) DESC',
  verification: 'b.verified DESC, IFNULL(sh.shipment_count, 0) DESC',
  name: 'b.company_name ASC',
};

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, 'general', String(user.id));
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const product = searchParams.get('product')?.trim() || '';
  const hsCode = searchParams.get('hsCode')?.trim() || '';
  const hsChapter = searchParams.get('hsChapter')?.trim() || '';
  const country = searchParams.get('country')?.trim() || '';
  const verifiedParam = searchParams.get('verified');
  const minShipments = parseInt(searchParams.get('minShipments') || '0', 10) || 0;
  const minValue = parseFloat(searchParams.get('minValue') || '0') || 0;
  const sort = Object.prototype.hasOwnProperty.call(SORT_MAP, searchParams.get('sort') || '')
    ? searchParams.get('sort')
    : 'relevance';
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);

  const where = [];
  const params = [];

  if (q) {
    where.push('(b.company_name LIKE ? OR b.product LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (product) {
    where.push('b.product LIKE ?');
    params.push(`%${product}%`);
  }
  if (hsCode) {
    // HS codes are strings — always compared/stored as strings, never numeric.
    where.push('b.hs_code = ?');
    params.push(String(hsCode));
  }
  if (hsChapter) {
    where.push('b.hs_code LIKE ?');
    params.push(`${String(hsChapter)}%`);
  }
  if (country) {
    where.push('b.country = ?');
    params.push(country);
  }
  if (verifiedParam === 'true' || verifiedParam === 'false') {
    where.push('b.verified = ?');
    params.push(verifiedParam === 'true' ? 1 : 0);
  }
  if (minShipments > 0) {
    where.push('IFNULL(sh.shipment_count, 0) >= ?');
    params.push(minShipments);
  }
  if (minValue > 0) {
    where.push('IFNULL(sh.total_shipment_value, 0) >= ?');
    params.push(minValue);
  }

  // The buyers table itself has no shipment stats — those live in the
  // shipments table, matched by company name (importer = buyer's name).
  // This correlated subquery aggregates them once per buyer.
  const shipmentJoin = `
    LEFT JOIN (
      SELECT importer AS company_name,
             COUNT(*) AS shipment_count,
             SUM(shipment_value) AS total_shipment_value,
             MAX(shipment_date) AS last_shipment_date
      FROM shipments
      GROUP BY importer
    ) sh ON sh.company_name = b.company_name
  `;

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Count for pagination metadata.
  const countRows = await query(
    `SELECT COUNT(*) AS total FROM buyers b ${shipmentJoin} ${whereClause}`,
    params
  );
  const total = countRows[0]?.total || 0;

  // For leadScore sort we fetch a superset ordered by a reasonable proxy,
  // score in JS (deterministic), then re-sort — keeps the SQL simple and
  // still respects LIMIT/OFFSET on the final, scored list.
  const needsJsSort = sort === 'leadScore';
  const orderClause = needsJsSort
    ? 'ORDER BY IFNULL(sh.shipment_count, 0) DESC, IFNULL(sh.total_shipment_value, 0) DESC'
    : `ORDER BY ${SORT_MAP[sort]}`;

  const fetchLimit = needsJsSort ? Math.min(MAX_LIMIT * 5, total || MAX_LIMIT * 5) : limit;
  const fetchOffset = needsJsSort ? 0 : offset;

  const rows = await query(
    `SELECT
        b.id, b.company_name, b.country, b.product, b.hs_code, b.verified,
        b.email, b.phone, b.contact_person, b.website,
        IFNULL(sh.shipment_count, 0) AS shipment_count,
        IFNULL(sh.total_shipment_value, 0) AS total_shipment_value,
        sh.last_shipment_date
     FROM buyers b
     ${shipmentJoin}
     ${whereClause}
     ${orderClause}
     LIMIT ? OFFSET ?`,
    [...params, fetchLimit, fetchOffset]
  );

  const unlockedIds = await getUnlockedEntityIds(user.id, 'BUYER');

  let results = rows.map((row) => {
    const { score, potential, reasons } = computeLeadScore({
      shipmentCount: row.shipment_count,
      totalShipmentValue: row.total_shipment_value,
      verified: !!row.verified,
      productMatch: Boolean(product && row.product?.toLowerCase().includes(product.toLowerCase())) ||
        Boolean(hsCode && row.hs_code === hsCode),
      countryMatch: Boolean(country && row.country === country),
      lastShipmentDate: row.last_shipment_date,
    });

    const isUnlocked = unlockedIds.has(row.id) || user.role === 'ADMIN';

    return {
      id: row.id,
      companyName: row.company_name,
      country: row.country,
      product: row.product,
      hsCode: row.hs_code != null ? String(row.hs_code) : null, // preserve leading zeroes
      shipmentCount: row.shipment_count,
      totalShipmentValue: row.total_shipment_value,
      verified: !!row.verified,
      leadScore: score,
      potential,
      scoreReasons: reasons,
      lastShipmentDate: row.last_shipment_date,
      contactAvailable: true,
      contactUnlocked: isUnlocked,
      // Contact fields ONLY included when legitimately unlocked or admin.
      ...(isUnlocked
        ? {
            email: row.email,
            phone: row.phone,
            contactPerson: row.contact_person,
            website: row.website,
          }
        : {}),
    };
  });

  if (needsJsSort) {
    results = results.sort((a, b) => b.leadScore - a.leadScore).slice(offset, offset + limit);
  }

  return NextResponse.json({
    results,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
}

async function getUnlockedEntityIds(userId, entityType) {
  // Reuses the EXISTING unlock system (unlock_requests table).
  const column = entityType === 'BUYER' ? 'buyer_id' : 'supplier_id';
  const rows = await query(
    `SELECT ${column} AS entity_id FROM unlock_requests WHERE user_id = ? AND status = 'GRANTED' AND ${column} IS NOT NULL`,
    [userId]
  );
  return new Set(rows.map((r) => r.entity_id));
}
