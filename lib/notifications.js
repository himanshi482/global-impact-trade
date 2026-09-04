import { query } from "./db";

export async function createNotification({ userId, type, title, message, referenceId = null }) {
  const existing = await query(
    "SELECT id FROM notifications WHERE user_id = ? AND type = ? AND reference_id <=> ? AND title = ? AND message = ? LIMIT 1",
    [userId, type, referenceId, title, message]
  );
  if (existing.length) return { created: false, id: existing[0].id };
  const result = await query(
    "INSERT INTO notifications (user_id, type, title, message, reference_id) VALUES (?, ?, ?, ?, ?)",
    [userId, type, title, message, referenceId]
  );
  return { created: true, id: result.insertId };
}
