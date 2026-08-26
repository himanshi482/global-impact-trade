import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getRemainingUnlocks } from "@/lib/limits";

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
  const user = await requireUser();
  if (user instanceof Response) return user;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { buyerId, supplierId } = body;
  if (!buyerId && !supplierId) {
    return Response.json({ error: "buyerId or supplierId is required" }, { status: 400 });
  }

  try {
    const targetBuyerId = buyerId ? Number(buyerId) : null;
    const targetSupplierId = supplierId ? Number(supplierId) : null;

    // Check if already unlocked by this user
    const existing = await query(
      "SELECT id FROM unlock_requests WHERE user_id = ? AND (buyer_id = ? OR supplier_id = ?)",
      [user.id, targetBuyerId, targetSupplierId]
    );

    if (existing.length === 0) {
      // Check quota limits if not already unlocked
      const quota = await getRemainingUnlocks(user.id);
      if (!quota.isUnlimited && quota.remaining <= 0) {
        return Response.json(
          {
            error: `Plan limit reached (${quota.used}/${quota.maxAllowed} contact unlocks used). Upgrade your subscription plan to unlock more entity contacts.`,
            granted: false,
            quota,
          },
          { status: 403 }
        );
      }

      // Grant unlock
      await query(
        "INSERT INTO unlock_requests (user_id, buyer_id, supplier_id, status) VALUES (?, ?, ?, 'GRANTED')",
        [user.id, targetBuyerId, targetSupplierId]
      );
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
