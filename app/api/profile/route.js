import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  try {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_verified AS isVerified,
              u.created_at AS createdAt, c.company_name AS companyName, c.industry,
              c.country, c.city, c.website, s.plan, s.status AS subscriptionStatus
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'ACTIVE'
       WHERE u.id = ?`,
      [user.id]
    );

    const userProfile = rows[0];
    if (!userProfile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    return Response.json({ user: userProfile });
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return Response.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, phone, companyName, country, city, website } = body;

  try {
    await query(
      "UPDATE users SET name = ?, phone = ? WHERE id = ?",
      [name || user.name, phone || null, user.id]
    );

    if (user.companyId && companyName) {
      await query(
        `UPDATE companies SET company_name = ?, country = ?, city = ?, website = ? WHERE id = ?`,
        [companyName, country || null, city || null, website || null, user.companyId]
      );
    } else if (companyName) {
      const compRes = await query(
        `INSERT INTO companies (company_name, country, city, website) VALUES (?, ?, ?, ?)`,
        [companyName, country || null, city || null, website || null]
      );
      await query("UPDATE users SET company_id = ? WHERE id = ?", [compRes.insertId, user.id]);
    }

    return Response.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
