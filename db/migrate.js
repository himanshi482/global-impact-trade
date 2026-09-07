// Runs each .sql file in db/migrations, in filename order, using a plain
// MySQL connection (not the app's pool, since migrations run once from the
// CLI and need multi-statement support).
//
// Tracks applied migrations in a `_migrations` table so re-running this is
// safe — already-applied files are skipped.

import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { getSslConfig } from "./sslConfig.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
    ...(getSslConfig() ? { ssl: getSslConfig() } : {}),
  });

  // Migration files may CREATE DATABASE IF NOT EXISTS on their own, but the
  // _migrations tracking table (created just below) needs a database
  // already selected on this connection. Create it here if needed, then
  // switch to it, so this script works whether or not the DB already
  // exists.
  const dbName = process.env.DB_NAME || "globebridge";
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.changeUser({ database: dbName });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [appliedRows] = await connection.query(
      "SELECT filename FROM _migrations"
    );
    const applied = new Set(appliedRows.map((r) => r.filename));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip   ${file} (already applied)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`apply  ${file}`);
      await connection.query(sql);
      await connection.query(
        "INSERT INTO _migrations (filename) VALUES (?)",
        [file]
      );
    }

    console.log("Migrations complete.");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
