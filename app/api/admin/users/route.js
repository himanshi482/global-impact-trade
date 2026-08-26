import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  try {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active AS isActive,
              u.is_verified AS isVerified, u.created_at AS createdAt, c.company_name AS companyName
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       ORDER BY u.created_at DESC`
    );
    return Response.json({ data: rows });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return Response.json({ error: "Failed to load users" }, { status: 500 });
  }
}
