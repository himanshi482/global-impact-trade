// Server-side "who is making this request" helper for App Router route
// handlers. Reads the signed session cookie, verifies it, and loads the
// current user row from MySQL (fresh on every call — we deliberately don't
// trust anything except the user id out of the token, so a role change or
// deactivation in the DB takes effect immediately instead of waiting for
// the token to expire).

import { cookies } from "next/headers";
import { query } from "./db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./auth";

/**
 * @returns {Promise<{id:number,name:string,email:string,phone:string|null,role:'USER'|'ADMIN',companyId:number|null,isVerified:boolean,isActive:boolean}|null>}
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  const rows = await query(
    `SELECT id, name, email, phone, role, company_id AS companyId,
            is_verified AS isVerified, is_active AS isActive
     FROM users WHERE id = ?`,
    [Number(payload.sub)]
  );

  const user = rows[0];
  if (!user || !user.isActive) return null;

  return user;
}

/**
 * Throws a Response-shaped error object route handlers can return directly.
 * Usage in a route handler:
 *   const user = await requireUser();
 *   if (user instanceof Response) return user;
 */
export async function requireUser() {
  let user;
  try {
    user = await getCurrentUser();
  } catch (err) {
    console.error("requireUser: failed to load session", err);
    return Response.json({ error: "Service temporarily unavailable" }, { status: 500 });
  }
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export async function requireAdmin() {
  let user;
  try {
    user = await getCurrentUser();
  } catch (err) {
    console.error("requireAdmin: failed to load session", err);
    return Response.json({ error: "Service temporarily unavailable" }, { status: 500 });
  }
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN" && user.role !== "admin") {
    return Response.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }
  return user;
}
