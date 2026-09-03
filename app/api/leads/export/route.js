// app/api/leads/export/route.js
// Stage 3 Phase 2 — GET /api/leads/export
//
// Exports ONLY the authenticated user's own leads. Contact fields are
// included only for entities that user has legitimately unlocked.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { rateLimitResponse } from '@/lib/rateLimit';

const CSV_HEADERS = [
  'Company',
  'Country',
  'Entity Type',
  'Lead Score',
  'Potential',
  'Status',
  'Notes',
  'Created Date',
];

function potentialLabel(score) {
  if (score >= 80) return 'HIGH POTENTIAL';
  if (score >= 50) return 'MEDIUM POTENTIAL';
  return 'LOW POTENTIAL';
}

// RFC 4180-style CSV field escaping.
function escapeCsvField(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields) {
  return fields.map(escapeCsvField).join(',');
}

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const limited = rateLimitResponse(request, 'general', String(user.id));
  if (limited) return limited;

  const rows = await query(
    `SELECT sl.entity_type, sl.entity_id, sl.lead_score, sl.status, sl.notes, sl.created_at,
            CASE WHEN sl.entity_type = 'BUYER' THEN b.company_name ELSE s.company_name END AS company_name,
            CASE WHEN sl.entity_type = 'BUYER' THEN b.country ELSE s.country END AS country
     FROM saved_leads sl
     LEFT JOIN buyers b ON sl.entity_type = 'BUYER' AND sl.entity_id = b.id
     LEFT JOIN suppliers s ON sl.entity_type = 'SUPPLIER' AND sl.entity_id = s.id
     WHERE sl.user_id = ?
     ORDER BY sl.created_at DESC`,
    [user.id]
  );

  const lines = [toCsvRow(CSV_HEADERS)];
  for (const r of rows) {
    lines.push(
      toCsvRow([
        r.company_name,
        r.country,
        r.entity_type,
        r.lead_score,
        potentialLabel(r.lead_score),
        r.status,
        r.notes || '',
        new Date(r.created_at).toISOString(),
      ])
    );
  }

  const csv = lines.join('\r\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="globebridge-leads-${Date.now()}.csv"`,
    },
  });
}
