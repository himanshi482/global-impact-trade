// app/api/leads/[id]/route.js
// Stage 3 Phase 2 — PUT /api/leads/[id], DELETE /api/leads/[id]
//
// Every query is scoped to `WHERE id = ? AND user_id = ?` so a user can
// never read, edit, or delete another user's lead (see E2E "Ownership"
// tests). A lead that exists but belongs to someone else returns 404,
// not 403 — this avoids confirming the lead's existence to non-owners.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { rateLimitResponse } from '@/lib/rateLimit';
import { VALID_STATUSES, sanitizeNotes } from '@/lib/leads';

export async function PUT(request, { params }) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, 'general', String(user.id));
  if (limited) return limited;

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (!Number.isInteger(leadId) || leadId <= 0) {
    return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const updates = [];
  const values = [];

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    updates.push('status = ?');
    values.push(body.status);
  }

  if (body.notes !== undefined) {
    updates.push('notes = ?');
    values.push(sanitizeNotes(body.notes));
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const result = await query(
    `UPDATE saved_leads SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    [...values, leadId, user.id]
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, 'general', String(user.id));
  if (limited) return limited;

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (!Number.isInteger(leadId) || leadId <= 0) {
    return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 });
  }

  const result = await query(
    `DELETE FROM saved_leads WHERE id = ? AND user_id = ?`,
    [leadId, user.id]
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
