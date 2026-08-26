import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  try {
    const [contacts, demos] = await Promise.all([
      query("SELECT * FROM contact_requests ORDER BY created_at DESC LIMIT 100"),
      query("SELECT * FROM demo_requests ORDER BY created_at DESC LIMIT 100"),
    ]);

    return Response.json({ contacts, demos });
  } catch (err) {
    console.error("GET /api/admin/requests error:", err);
    return Response.json({ error: "Failed to load request records" }, { status: 500 });
  }
}
