import crypto from "crypto";
import { query } from "@/lib/db";
import { forgotPasswordSchema, validateBody } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data, error } = validateBody(forgotPasswordSchema, body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  // Always return the same success response whether or not the email
  // exists — otherwise this endpoint becomes a way to check which emails
  // are registered.
  const genericResponse = Response.json({
    message: "If an account exists for that email, a reset link has been sent.",
  });

  try {
    const rows = await query("SELECT id FROM users WHERE email = ?", [data.email]);
    const user = rows[0];
    if (!user) {
      return genericResponse;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await query(
      `INSERT INTO auth_tokens (user_id, token_hash, purpose, expires_at)
       VALUES (?, ?, 'PASSWORD_RESET', ?)`,
      [user.id, tokenHash, expiresAt]
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(data.email, resetUrl);

    return genericResponse;
  } catch (err) {
    console.error("Forgot-password error:", err);
    // Still return the generic response — don't leak internals, and don't
    // give an attacker a way to distinguish "no such user" from "DB error".
    return genericResponse;
  }
}
