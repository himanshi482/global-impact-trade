// app/api/buyers/discover/route.js
// Stage 3 Phase 2 — GET /api/buyers/discover
//
// ASSUMPTIONS (adjust import paths to match your actual repo):
//   - lib/db.js           exports `query(sql, params)` over the mysql2 pool
//   - lib/auth.js         exports `requireUser(request)` -> { id, role, ... } | throws/returns null
//   - lib/rateLimit.js    exports `rateLimit(request, key)` -> throws/returns 429 response
//   - buyers table has columns roughly: id, company_name, country, product,
//     hs_code, hs_chapter, shipment_count, total_shipment_value, verified,
//     last_shipment_date, email, phone, contact_person, website
//   - unlocks table (or equivalent) records user_id + entity_type + entity_id
//     for the existing /api/unlock system — reused here read-only.
//
// If your actual table/column names differ, only the SQL in this file
// needs to change — the request/response contract stays the same.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { computeLeadScore } from '@/lib/leadScoring';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const SORT_MAP = {
  relevance: 'b.shipment_count DESC, b.total_shipment_value DESC',
  leadScore: null, // computed in JS after fetch; see below
  activity: 'b.shipment_count DESC',
  value: 'b.total_shipment_value DESC',
  verification: 'b.verified DESC, b.shipment_count DESC',
  name: 'b.company_name ASC',
};

export async function GET(request) {
  let user;
  try {
    user = await requireUser(request);
  } catch {
    user = null;
  }
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = await rateLimit(request, `buyers-discover:${user.id}`);
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
  const sort = SORT_MAP.hasOwnProperty(searchParams.get('sort') || '')
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
    where.push('b.shipment_count >= ?');
    params.push(minShipments);
  }
  if (minValue > 0) {
    where.push('b.total_shipment_value >= ?');
    params.push(minValue);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Count for pagination metadata.
  const countRows = await query(
    `SELECT COUNT(*) AS total FROM buyers b ${whereClause}`,
    params
  );
  const total = countRows[0]?.total || 0;

  // For leadScore sort we fetch a superset ordered by a reasonable proxy,
  // score in JS (deterministic), then re-sort — keeps the SQL simple and
  // still respects LIMIT/OFFSET on the final, scored list.
  const needsJsSort = sort === 'leadScore';
  const orderClause = needsJsSort
    ? 'ORDER BY b.shipment_count DESC, b.total_shipment_value DESC'
    : `ORDER BY ${SORT_MAP[sort]}`;

  const fetchLimit = needsJsSort ? Math.min(MAX_LIMIT * 5, total || MAX_LIMIT * 5) : limit;
  const fetchOffset = needsJsSort ? 0 : offset;

  const rows = await query(
    `SELECT
        b.id, b.company_name, b.country, b.product, b.hs_code,
        b.shipment_count, b.total_shipment_value, b.verified,
        b.last_shipment_date, b.email, b.phone, b.contact_person, b.website
     FROM buyers b
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
      hsCode: String(row.hs_code), // preserve leading zeroes
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
  // Reuses the EXISTING unlock system's data — read-only lookup here.
  // Adjust table/column names to match your existing unlock schema.
  const rows = await query(
    `SELECT entity_id FROM contact_unlocks WHERE user_id = ? AND entity_type = ?`,
    [userId, entityType]
  );
  return new Set(rows.map((r) => r.entity_id));
}
