// Singleton MySQL connection pool (mysql2/promise).
//
// Next.js dev mode hot-reloads modules on every save, which would otherwise
// create a new pool (and leak connections) each time. We stash the pool on
// globalThis in development so it survives reloads, same pattern that would
// have been used for a Prisma client singleton.
//
// Usage:
//   import { query } from "@/lib/db";
//   const rows = await query("SELECT * FROM users WHERE email = ?", [email]);

import mysql from "mysql2/promise";

const globalForDb = globalThis;

function createPool() {
  // Managed MySQL providers (Aiven, Clever Cloud, PlanetScale, etc.) require
  // SSL by default — a plain connection to them fails, and that failure was
  // showing up as a generic 500 on every DB-touching route (register, login,
  // ...). Set DB_SSL=true for those. If the provider gives you a CA
  // certificate, paste its full contents (including the BEGIN/END lines)
  // into DB_SSL_CA for a properly verified connection; without it we fall
  // back to an encrypted-but-unverified connection so things still work.
  const useSSL = process.env.DB_SSL === "true";
  const ssl = useSSL
    ? {
        rejectUnauthorized: Boolean(process.env.DB_SSL_CA),
        ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {}),
      }
    : undefined;

  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "globebridge",
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    dateStrings: false,
    ...(ssl ? { ssl } : {}),
  });
}

export const pool = globalForDb.dbPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbPool = pool;
}

/**
 * Run a parameterized query. Always use placeholders (?) for any value that
 * comes from user input — never build SQL with string concatenation, that's
 * how SQL injection happens.
 *
 * @param {string} sql
 * @param {any[]} params
 * @returns {Promise<any[]>} rows
 */
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Run several statements against a single connection wrapped in a
 * transaction. `fn` receives a connection with the same `.query()` shape as
 * the pool. Commits on success, rolls back on any thrown error.
 *
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<any>} fn
 */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export default pool;
