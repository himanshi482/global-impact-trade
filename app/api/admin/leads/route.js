// app/api/admin/leads/route.js
// Stage 3 Phase 2 — GET /api/admin/leads (ADMIN only)

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { VALID_ENTITY_TYPES, VALID_STATUSES } from '@/lib/leads';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

const SORT_MAP = {
  newest: 'sl.created_at DESC',
  oldest: 'sl.created_at ASC',
  score: 'sl.lead_score DESC',
  company: 'company_name ASC',
};

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const companyQuery = searchParams.get('company')?.trim() || '';
  const userQuery = searchParams.get('user')?.trim() || '';
  const entityType = searchParams.get('entityType');
  const status = searchParams.get('status');
  const sort = SORT_MAP.hasOwnProperty(searchParams.get('sort') || '')
    ? searchParams.get('sort')
    : 'newest';
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);

  const where = [];
  const params = [];

  if (companyQuery) {
    where.push(
      `(CASE WHEN sl.entity_type = 'BUYER' THEN b.company_name ELSE s.company_name END) LIKE ?`
    );
    params.push(`%${companyQuery}%`);
  }
  if (userQuery) {
    where.push('(u.email LIKE ? OR u.name LIKE ?)');
    params.push(`%${userQuery}%`, `%${userQuery}%`);
  }
  if (entityType && VALID_ENTITY_TYPES.includes(entityType)) {
    where.push('sl.entity_type = ?');
    params.push(entityType);
  }
  if (status && VALID_STATUSES.includes(status)) {
    where.push('sl.status = ?');
    params.push(status);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countRows = await query(
    `SELECT COUNT(*) AS total
     FROM saved_leads sl
     JOIN users u ON sl.user_id = u.id
     LEFT JOIN buyers b ON sl.entity_type = 'BUYER' AND sl.entity_id = b.id
     LEFT JOIN suppliers s ON sl.entity_type = 'SUPPLIER' AND sl.entity_id = s.id
     ${whereClause}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const rows = await query(
    `SELECT sl.id, sl.entity_type, sl.entity_id, sl.lead_score, sl.status,
            sl.created_at, sl.updated_at,
            u.id AS user_id, u.email AS user_email, u.name AS user_name,
            CASE WHEN sl.entity_type = 'BUYER' THEN b.company_name ELSE s.company_name END AS company_name
     FROM saved_leads sl
     JOIN users u ON sl.user_id = u.id
     LEFT JOIN buyers b ON sl.entity_type = 'BUYER' AND sl.entity_id = b.id
     LEFT JOIN suppliers s ON sl.entity_type = 'SUPPLIER' AND sl.entity_id = s.id
     ${whereClause}
     ORDER BY ${SORT_MAP[sort]}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const leads = rows.map((r) => ({
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    companyName: r.company_name,
    leadScore: r.lead_score,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    user: { id: r.user_id, email: r.user_email, name: r.user_name },
  }));

  return NextResponse.json({
    leads,
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  });
}
