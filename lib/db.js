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
