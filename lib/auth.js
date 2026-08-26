// Authentication helpers: password hashing (bcrypt) and session tokens
// (signed JWT in an httpOnly cookie — this is the "another secure
// session-based authentication solution" the spec allows as an alternative
// to NextAuth/Auth.js, chosen because it's simpler to reason about and has
// no dependency on Auth.js's compatibility with this Next.js version).

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "gb_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it to your .env file (see .env.example)."
    );
  }
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

// ---------------------------------------------------------------------
// Session tokens
// ---------------------------------------------------------------------

/**
 * Signs a session JWT for the given user. Keep the payload minimal —
 * this is what every request will decode, and it's not re-checked
 * against the DB on every call (see getSessionUser).
 */
export async function createSessionToken(user) {
  return new SignJWT({
    sub: String(user.id),
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload; // { sub, role, iat, exp }
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export { SESSION_COOKIE_NAME };
