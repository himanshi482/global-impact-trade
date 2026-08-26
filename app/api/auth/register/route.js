import { cookies } from "next/headers";
import { query, transaction } from "@/lib/db";
import { hashPassword, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { registerSchema, validateBody } from "@/lib/validation";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, error } = validateBody(registerSchema, body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  const { fullName, email, phone, password, companyName, country, industry } = data;

  try {
    const existing = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await transaction(async (conn) => {
      let companyId = null;
      if (companyName) {
        const [companyResult] = await conn.query(
          `INSERT INTO companies (company_name, industry, country)
           VALUES (?, ?, ?)`,
          [companyName, industry || null, country || null]
        );
        companyId = companyResult.insertId;
      }

      const [userResult] = await conn.query(
        `INSERT INTO users (name, email, password_hash, phone, role, company_id, is_verified, is_active)
         VALUES (?, ?, ?, ?, 'USER', ?, FALSE, TRUE)`,
        [fullName, email, passwordHash, phone, companyId]
      );
      const userId = userResult.insertId;

      await conn.query(
        `INSERT INTO subscriptions (user_id, plan, status, start_date)
         VALUES (?, 'FREE', 'ACTIVE', CURDATE())`,
        [userId]
      );

      return { userId, companyId };
    });

    const sessionUser = { id: result.userId, role: "USER" };
    const token = await createSessionToken(sessionUser);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieOptions().name, token, sessionCookieOptions());

    return Response.json(
      {
        user: {
          id: result.userId,
          name: fullName,
          email,
          phone,
          role: "USER",
          company: companyName || null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
