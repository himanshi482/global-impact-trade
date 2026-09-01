// lib/leads.js
// Shared helpers for the Lead APIs. Kept out of route.js files because
// Next.js App Router route files may only export HTTP method handlers.

const VALID_ENTITY_TYPES = ['BUYER', 'SUPPLIER'];
const VALID_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST'];
const MAX_NOTES_LENGTH = 2000;

function sanitizeNotes(notes) {
  if (notes == null) return null;
  // Strip any HTML tags — notes are stored and rendered as plain text only.
  const stripped = String(notes).replace(/<[^>]*>/g, '');
  return stripped.slice(0, MAX_NOTES_LENGTH);
}

function clampScore(score) {
  const n = parseInt(score, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

module.exports = {
  VALID_ENTITY_TYPES,
  VALID_STATUSES,
  sanitizeNotes,
  clampScore,
};
