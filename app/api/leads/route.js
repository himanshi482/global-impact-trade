// app/api/leads/route.js
// Stage 3 Phase 2 — GET /api/leads, POST /api/leads
//
// Ownership is ALWAYS enforced server-side from the authenticated
// session (user.id). The frontend never supplies user_id, and any
// user_id in the request body is ignored.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { rateLimitResponse } from '@/lib/rateLimit';
import { VALID_ENTITY_TYPES, VALID_STATUSES, sanitizeNotes, clampScore } from '@/lib/leads';

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, 'general', String(user.id));
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const entityType = searchParams.get('entityType');

  const where = ['sl.user_id = ?'];
  const params = [user.id];

  if (status && VALID_STATUSES.includes(status)) {
    where.push('sl.status = ?');
    params.push(status);
  }
  if (entityType && VALID_ENTITY_TYPES.includes(entityType)) {
    where.push('sl.entity_type = ?');
    params.push(entityType);
  }

  const rows = await query(
    `SELECT sl.id, sl.entity_type, sl.entity_id, sl.lead_score, sl.status,
            sl.notes, sl.created_at, sl.updated_at,
            CASE WHEN sl.entity_type = 'BUYER' THEN b.company_name ELSE s.company_name END AS company_name,
            CASE WHEN sl.entity_type = 'BUYER' THEN b.country ELSE s.country END AS country,
            CASE WHEN sl.entity_type = 'BUYER' THEN b.hs_code ELSE s.hs_code END AS hs_code
     FROM saved_leads sl
     LEFT JOIN buyers b ON sl.entity_type = 'BUYER' AND sl.entity_id = b.id
     LEFT JOIN suppliers s ON sl.entity_type = 'SUPPLIER' AND sl.entity_id = s.id
     WHERE ${where.join(' AND ')}
     ORDER BY sl.created_at DESC`,
    params
  );

  const leads = rows.map((r) => ({
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    companyName: r.company_name,
    country: r.country,
    hsCode: r.hs_code != null ? String(r.hs_code) : null,
    leadScore: r.lead_score,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const metrics = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'NEW').length,
    contacted: leads.filter((l) => l.status === 'CONTACTED').length,
    qualified: leads.filter((l) => l.status === 'QUALIFIED').length,
    negotiating: leads.filter((l) => l.status === 'NEGOTIATING').length,
    won: leads.filter((l) => l.status === 'WON').length,
    lost: leads.filter((l) => l.status === 'LOST').length,
    highPotential: leads.filter((l) => l.leadScore >= 80).length,
  };

  return NextResponse.json({ leads, metrics });
}

export async function POST(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, 'general', String(user.id));
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { entityType, entityId, leadScore, notes } = body;

  if (!VALID_ENTITY_TYPES.includes(entityType)) {
    return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 });
  }
  const parsedEntityId = parseInt(entityId, 10);
  if (!Number.isInteger(parsedEntityId) || parsedEntityId <= 0) {
    return NextResponse.json({ error: 'Invalid entityId' }, { status: 400 });
  }
  const parsedScore = clampScore(leadScore);

  // Confirm the entity actually exists (never trust the client blindly).
  const table = entityType === 'BUYER' ? 'buyers' : 'suppliers';
  const entityRows = await query(`SELECT id FROM ${table} WHERE id = ?`, [parsedEntityId]);
  if (entityRows.length === 0) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
  }

  // Duplicate protection (also enforced at the DB level via UNIQUE index).
  const existing = await query(
    `SELECT id FROM saved_leads WHERE user_id = ? AND entity_type = ? AND entity_id = ?`,
    [user.id, entityType, parsedEntityId]
  );
  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'Lead already exists in your pipeline.' },
      { status: 409 }
    );
  }

  try {
    const result = await query(
      `INSERT INTO saved_leads (user_id, entity_type, entity_id, lead_score, status, notes)
       VALUES (?, ?, ?, ?, 'NEW', ?)`,
      [user.id, entityType, parsedEntityId, parsedScore, sanitizeNotes(notes)]
    );
    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    // Race-condition fallback in case two requests land simultaneously —
    // the UNIQUE constraint on (user_id, entity_type, entity_id) catches it.
    if (err?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Lead already exists in your pipeline.' },
        { status: 409 }
      );
    }
    throw err;
  }
}
