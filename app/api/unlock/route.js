import { query, transaction } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getRemainingUnlocks } from "@/lib/limits";
import { unlockSchema, validateBody } from "@/lib/validation";
import { sameOriginResponse } from "@/lib/csrf";

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  try {
    const quota = await getRemainingUnlocks(user.id);
    const unlockedRows = await query(
      "SELECT buyer_id AS buyerId, supplier_id AS supplierId FROM unlock_requests WHERE user_id = ? AND status = 'GRANTED'",
      [user.id]
    );

    return Response.json({
      quota,
      unlockedBuyers: unlockedRows.map((r) => r.buyerId).filter(Boolean),
      unlockedSuppliers: unlockedRows.map((r) => r.supplierId).filter(Boolean),
    });
  } catch (err) {
    console.error("GET /api/unlock error:", err);
    return Response.json({ error: "Failed to load quota status" }, { status: 500 });
  }
}

export async function POST(request) {
  const csrfError = sameOriginResponse(request);
  if (csrfError) return csrfError;
  const user = await requireUser();
  if (user instanceof Response) return user;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, error } = validateBody(unlockSchema, body);
  if (error) return Response.json({ error }, { status: 400 });

  const { buyerId = null, supplierId = null } = data;
  const entityTable = buyerId ? "buyers" : "suppliers";
  const entityId = buyerId || supplierId;

  try {
    const targetBuyerId = buyerId;
    const targetSupplierId = supplierId;

    const result = await transaction(async (conn) => {
      // Lock before any reads so MySQL's repeatable-read snapshot includes
      // unlocks committed by earlier requests for this user.
      await conn.query("SELECT id FROM users WHERE id = ? FOR UPDATE", [user.id]);
      const [entityRows] = await conn.query(`SELECT id FROM ${entityTable} WHERE id = ?`, [entityId]);
      if (entityRows.length === 0) return { notFound: true };

      const [existing] = await conn.query(
        "SELECT id FROM unlock_requests WHERE user_id = ? AND buyer_id <=> ? AND supplier_id <=> ? AND status = 'GRANTED'",
        [user.id, targetBuyerId, targetSupplierId]
      );
      if (existing.length > 0) return { alreadyUnlocked: true };

      const [subRows] = await conn.query(
        "SELECT plan FROM subscriptions WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1",
        [user.id]
      );
      const [countRows] = await conn.query(
        "SELECT COUNT(*) AS total FROM unlock_requests WHERE user_id = ?",
        [user.id]
      );
      const plan = subRows[0]?.plan || "FREE";
      const maxAllowed = { FREE: 10, GROWTH: 50, CONNECT: 200, CONQUER: 999999 }[plan] || 10;
      const used = Number(countRows[0]?.total || 0);
      if (maxAllowed < 999999 && used >= maxAllowed) {
        return { quotaExceeded: true, plan, maxAllowed, used };
      }

      await conn.query(
        "INSERT INTO unlock_requests (user_id, buyer_id, supplier_id, entity_key, status) VALUES (?, ?, ?, ?, 'GRANTED')",
        [user.id, targetBuyerId, targetSupplierId, `${targetBuyerId || 0}:${targetSupplierId || 0}`]
      );
      return { granted: true };
    });

    if (result.notFound) return Response.json({ error: "Entity not found" }, { status: 404 });
    if (result.quotaExceeded) {
      return Response.json({
        error: `Plan limit reached (${result.used}/${result.maxAllowed} contact unlocks used). Upgrade your subscription plan to unlock more entity contacts.`,
        granted: false,
        quota: await getRemainingUnlocks(user.id),
      }, { status: 403 });
    }

    // Fetch entity contact details
    let contactInfo = null;
    if (targetBuyerId) {
      const rows = await query(
        "SELECT company_name AS companyName, contact_person AS contactPerson, email, phone, website FROM buyers WHERE id = ?",
        [targetBuyerId]
      );
      contactInfo = rows[0] || null;
    } else if (targetSupplierId) {
      const rows = await query(
        "SELECT company_name AS companyName, contact_person AS contactPerson, email, phone, website FROM suppliers WHERE id = ?",
        [targetSupplierId]
      );
      contactInfo = rows[0] || null;
    }

    const updatedQuota = await getRemainingUnlocks(user.id);
    return Response.json({
      message: "Contact unlocked successfully",
      granted: true,
      contact: contactInfo,
      quota: updatedQuota,
    });
  } catch (err) {
    console.error("POST /api/unlock error:", err);
    return Response.json({ error: "Failed to unlock contact details" }, { status: 500 });
  }
}
