// app/api/suppliers/discover/route.js
// Stage 3 Phase 2 — GET /api/suppliers/discover
// Mirrors app/api/buyers/discover/route.js — see that file for full
// commentary on assumptions. Adjust table/column names as needed.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { computeLeadScore } from '@/lib/leadScoring';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const SORT_MAP = {
  relevance: 's.shipment_count DESC, s.total_shipment_value DESC',
  leadScore: null,
  activity: 's.shipment_count DESC',
  value: 's.total_shipment_value DESC',
  verification: 's.verified DESC, s.shipment_count DESC',
  name: 's.company_name ASC',
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

  const limited = await rateLimit(request, `suppliers-discover:${user.id}`);
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
    where.push('(s.company_name LIKE ? OR s.product LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (product) {
    where.push('s.product LIKE ?');
    params.push(`%${product}%`);
  }
  if (hsCode) {
    where.push('s.hs_code = ?');
    params.push(String(hsCode));
  }
  if (hsChapter) {
    where.push('s.hs_code LIKE ?');
    params.push(`${String(hsChapter)}%`);
  }
  if (country) {
    where.push('s.country = ?');
    params.push(country);
  }
  if (verifiedParam === 'true' || verifiedParam === 'false') {
    where.push('s.verified = ?');
    params.push(verifiedParam === 'true' ? 1 : 0);
  }
  if (minShipments > 0) {
    where.push('s.shipment_count >= ?');
    params.push(minShipments);
  }
  if (minValue > 0) {
    where.push('s.total_shipment_value >= ?');
    params.push(minValue);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countRows = await query(
    `SELECT COUNT(*) AS total FROM suppliers s ${whereClause}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const needsJsSort = sort === 'leadScore';
  const orderClause = needsJsSort
    ? 'ORDER BY s.shipment_count DESC, s.total_shipment_value DESC'
    : `ORDER BY ${SORT_MAP[sort]}`;

  const fetchLimit = needsJsSort ? Math.min(MAX_LIMIT * 5, total || MAX_LIMIT * 5) : limit;
  const fetchOffset = needsJsSort ? 0 : offset;

  const rows = await query(
    `SELECT
        s.id, s.company_name, s.country, s.product, s.hs_code,
        s.shipment_count, s.total_shipment_value, s.verified,
        s.last_shipment_date, s.email, s.phone, s.contact_person, s.website
     FROM suppliers s
     ${whereClause}
     ${orderClause}
     LIMIT ? OFFSET ?`,
    [...params, fetchLimit, fetchOffset]
  );

  const unlockedIds = await getUnlockedEntityIds(user.id, 'SUPPLIER');

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
      hsCode: String(row.hs_code),
      shipmentCount: row.shipment_count,
      totalShipmentValue: row.total_shipment_value,
      verified: !!row.verified,
      leadScore: score,
      potential,
      scoreReasons: reasons,
      lastShipmentDate: row.last_shipment_date,
      contactAvailable: true,
      contactUnlocked: isUnlocked,
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
  const rows = await query(
    `SELECT entity_id FROM contact_unlocks WHERE user_id = ? AND entity_type = ?`,
    [userId, entityType]
  );
  return new Set(rows.map((r) => r.entity_id));
}
