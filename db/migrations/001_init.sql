-- GlobeBridge database schema
-- Run with: npm run db:migrate  (executes this file against DB_NAME)
--
-- Tables are added in Phase 3: users, companies, buyers, suppliers, hs_codes,
-- shipments, search_history, saved_searches, contact_requests,
-- demo_requests, subscriptions, unlock_requests — with foreign keys and
-- indexes on the frequently-searched columns (email, company_name, country,
-- product, hs_code, chapter, shipment_date).

CREATE DATABASE IF NOT EXISTS globebridge
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE globebridge;
