import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  try {
    const [
      usersCount,
      buyersCount,
      suppliersCount,
      shipmentsCount,
      hsCodesCount,
      contactsCount,
      demosCount,
    ] = await Promise.all([
      query("SELECT COUNT(*) AS total FROM users"),
      query("SELECT COUNT(*) AS total FROM buyers"),
      query("SELECT COUNT(*) AS total FROM suppliers"),
      query("SELECT COUNT(*) AS total FROM shipments"),
      query("SELECT COUNT(*) AS total FROM hs_codes"),
      query("SELECT COUNT(*) AS total FROM contact_requests WHERE status = 'NEW'"),
      query("SELECT COUNT(*) AS total FROM demo_requests WHERE status = 'NEW'"),
    ]);

    return Response.json({
      stats: {
        users: usersCount[0].total,
        buyers: buyersCount[0].total,
        suppliers: suppliersCount[0].total,
        shipments: shipmentsCount[0].total,
        hsCodes: hsCodesCount[0].total,
        pendingContacts: contactsCount[0].total,
        pendingDemos: demosCount[0].total,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/stats error:", err);
    return Response.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
