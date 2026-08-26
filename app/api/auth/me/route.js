import { getCurrentUser } from "@/lib/session";
import { query } from "@/lib/db";

export async function GET() {
  let sessionUser;
  try {
    sessionUser = await getCurrentUser();
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return Response.json({ error: "Service temporarily unavailable" }, { status: 500 });
  }

  if (!sessionUser) {
    return Response.json({ user: null });
  }

  // getCurrentUser() only loads the users table — pull the company name too
  // so the UI (Nav.js, dashboard) has what it expects without a second
  // client-side round trip.
  try {
    const rows = await query(
      `SELECT c.company_name AS company
       FROM companies c
       WHERE c.id = ?`,
      [sessionUser.companyId]
    );

    return Response.json({
      user: {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        phone: sessionUser.phone,
        role: sessionUser.role,
        company: rows[0]?.company || null,
      },
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return Response.json({ error: "Service temporarily unavailable" }, { status: 500 });
  }
}
