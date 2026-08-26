import crypto from "crypto";
import { query, transaction } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema, validateBody } from "@/lib/validation";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, error } = validateBody(resetPasswordSchema, body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(data.token).digest("hex");

    const rows = await query(
      `SELECT id, user_id AS userId, expires_at AS expiresAt, used_at AS usedAt
       FROM auth_tokens
       WHERE token_hash = ? AND purpose = 'PASSWORD_RESET'`,
      [tokenHash]
    );
    const tokenRow = rows[0];

    if (!tokenRow || tokenRow.usedAt || new Date(tokenRow.expiresAt) < new Date()) {
      return Response.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(data.password);

    await transaction(async (conn) => {
      await conn.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        passwordHash,
        tokenRow.userId,
      ]);
      await conn.query("UPDATE auth_tokens SET used_at = NOW() WHERE id = ?", [
        tokenRow.id,
      ]);
    });

    return Response.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    console.error("Reset-password error:", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
