// Shared SSL config helper for the standalone mysql2 connections used by
// db/migrate.js and db/seed.js (lib/db.js has its own copy of this logic
// for the app's pooled connections — see the comment there for why this
// exists).
export function getSslConfig() {
  const useSSL = process.env.DB_SSL === "true";
  if (!useSSL) return undefined;

  return {
    rejectUnauthorized: Boolean(process.env.DB_SSL_CA),
    ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {}),
  };
}
