// Populates the database with demo data derived from data/tradeData.js,
// plus one development admin account.
//
// Safe to re-run: uses INSERT ... ON DUPLICATE KEY UPDATE / checks for
// existing rows where a natural unique key exists, so running this twice
// doesn't create duplicates.
//
// Run with: npm run db:seed

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { getSslConfig } from "./sslConfig.js";

import {
  HS_CHAPTERS,
  BUYER_ENTITIES,
  SELLER_ENTITIES,
  RECENT_SHIPMENTS,
} from "../data/tradeData.js";

dotenv.config();

// tradeData.js volume strings look like "3,850 MT" / "24,000 KGS" — pull the
// leading number out for the DECIMAL columns, keep the original string too
// where the schema has a text column (import_volume / export_volume).
function parseQuantity(text) {
  if (!text) return null;
  const match = String(text).replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

function parseMoney(text) {
  if (!text) return null;
  const match = String(text).replace(/,/g, "").match(/[\d.]+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return /\$\d.*M/i.test(text) ? num * 1_000_000 : num;
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "globebridge",
    ...(getSslConfig() ? { ssl: getSslConfig() } : {}),
  });

  try {
    // -----------------------------------------------------------------
    // 1. HS Codes — derived from HS_CHAPTERS (chapter-level duty rates,
    //    exploded across each chapter's topCodes into individual HS code
    //    rows so /api/hs-codes has real codes to search, not just chapters)
    // -----------------------------------------------------------------
    let hsCodeCount = 0;
    for (const ch of HS_CHAPTERS) {
      const codes = ch.topCodes && ch.topCodes.length ? ch.topCodes : [ch.chapter];
      for (const code of codes) {
        await connection.query(
          `INSERT INTO hs_codes (code, description, chapter, bcd, sws, igst, country)
           VALUES (?, ?, ?, ?, ?, ?, 'India')
           ON DUPLICATE KEY UPDATE description = VALUES(description), bcd = VALUES(bcd), igst = VALUES(igst)`,
          [code, ch.name, ch.chapter, ch.bcd, "10%", ch.igst]
        );
        hsCodeCount++;
      }
    }
    console.log(`hs_codes: ${hsCodeCount} rows upserted`);

    // -----------------------------------------------------------------
    // 2. Buyers — from BUYER_ENTITIES
    //    (no natural unique key on this table, so guard re-runs by count
    //    instead — this is static demo data, it's either seeded or not)
    // -----------------------------------------------------------------
    const [buyerCountRows] = await connection.query("SELECT COUNT(*) AS n FROM buyers");
    if (buyerCountRows[0].n > 0) {
      console.log("buyers: already seeded, skipping");
    } else {
      for (const b of BUYER_ENTITIES) {
        const chapter = b.hsCode ? b.hsCode.slice(0, 2) : null;
        await connection.query(
          `INSERT INTO buyers
             (company_name, contact_person, email, phone, country, city, product, hs_code, hs_chapter, import_volume, website, verified)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.name,
            null,
            null,
            null,
            b.country,
            b.city || null,
            b.product,
            b.hsCode || null,
            chapter,
            b.volumeMT || null,
            null,
            !!b.verified,
          ]
        );
      }
      console.log(`buyers: ${BUYER_ENTITIES.length} rows inserted`);
    }

    // -----------------------------------------------------------------
    // 3. Suppliers — from SELLER_ENTITIES
    // -----------------------------------------------------------------
    const [supplierCountRows] = await connection.query("SELECT COUNT(*) AS n FROM suppliers");
    if (supplierCountRows[0].n > 0) {
      console.log("suppliers: already seeded, skipping");
    } else {
      for (const s of SELLER_ENTITIES) {
        const chapter = s.hsCode ? s.hsCode.slice(0, 2) : null;
        await connection.query(
          `INSERT INTO suppliers
             (company_name, contact_person, email, phone, country, city, product, hs_code, hs_chapter, export_volume, website, verified)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.name,
            null,
            null,
            null,
            s.country,
            s.city || null,
            s.product,
            s.hsCode || null,
            chapter,
            s.capacityMT || null,
            null,
            !!s.verified,
          ]
        );
      }
      console.log(`suppliers: ${SELLER_ENTITIES.length} rows inserted`);
    }

    // -----------------------------------------------------------------
    // 4. Shipments — from RECENT_SHIPMENTS
    // -----------------------------------------------------------------
    const [shipmentCountRows] = await connection.query("SELECT COUNT(*) AS n FROM shipments");
    if (shipmentCountRows[0].n > 0) {
      console.log("shipments: already seeded, skipping");
    } else {
      for (const sh of RECENT_SHIPMENTS) {
        await connection.query(
          `INSERT INTO shipments
             (exporter, importer, product, hs_code, quantity, unit, shipment_value,
              origin_country, destination_country, origin_port, destination_port, shipment_date)
           VALUES (?, ?, ?, ?, ?, 'KGS', ?, ?, ?, ?, ?, ?)`,
          [
            sh.shipper,
            sh.consignee,
            sh.description,
            sh.hsCode || null,
            parseQuantity(sh.weight),
            parseMoney(sh.valueUSD),
            sh.pol || null,
            sh.pod || null,
            sh.pol || null,
            sh.pod || null,
            sh.date || null,
          ]
        );
      }
      console.log(`shipments: ${RECENT_SHIPMENTS.length} rows inserted`);
    }

    // -----------------------------------------------------------------
    // 5. Dev admin account — email/password are dev-only, printed below
    //    so nothing is silently hard-coded and forgotten.
    // -----------------------------------------------------------------
    const adminEmail = "admin@globebridge.dev";
    const adminPassword = "Admin@12345"; // dev only — change after first login
    const [existing] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [adminEmail]
    );

    let adminId;
    if (existing.length) {
      adminId = existing[0].id;
      console.log(`admin user already exists (id ${adminId}), skipping create`);
    } else {
      const hash = await bcrypt.hash(adminPassword, 10);
      const [result] = await connection.query(
        `INSERT INTO users (name, email, password_hash, role, is_verified, is_active)
         VALUES (?, ?, ?, 'ADMIN', TRUE, TRUE)`,
        ["GlobeBridge Admin", adminEmail, hash]
      );
      adminId = result.insertId;
      await connection.query(
        `INSERT INTO subscriptions (user_id, plan, status, start_date)
         VALUES (?, 'CONQUER', 'ACTIVE', CURDATE())`,
        [adminId]
      );
      console.log(`admin user created (id ${adminId})`);
      console.log(`  email:    ${adminEmail}`);
      console.log(`  password: ${adminPassword}  (change this after first login)`);
    }

    console.log("\nSeed complete.");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
