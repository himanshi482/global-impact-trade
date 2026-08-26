import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { verifyPassword, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { loginSchema, validateBody } from "@/lib/validation";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, error } = validateBody(loginSchema, body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  try {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.password_hash AS passwordHash,
              u.is_active AS isActive, c.company_name AS company
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.email = ?`,
      [data.email]
    );
    const user = rows[0];

    // Deliberately identical error for "no such user" and "wrong password"
    // — don't leak which one it was, that's a user-enumeration vector.
    if (!user) {
      return Response.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    const passwordOk = await verifyPassword(data.password, user.passwordHash);
    if (!passwordOk) {
      return Response.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    if (!user.isActive) {
      return Response.json(
        { error: "This account has been deactivated. Contact support." },
        { status: 403 }
      );
    }

    const token = await createSessionToken(user);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieOptions().name, token, sessionCookieOptions());

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        company: user.company,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
