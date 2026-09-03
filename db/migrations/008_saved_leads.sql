-- ============================================================
-- Migration 007: saved_leads
-- Stage 3 Phase 2 — Lead Management
--
-- NOTE: Inspect your existing db/migrations directory before running.
-- If a migration numbered 007 already exists, rename this file to the
-- next available number (e.g. 008_saved_leads.sql) and update any
-- migration-runner manifest/index file accordingly.
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_leads (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  entity_type   ENUM('BUYER', 'SUPPLIER') NOT NULL,
  entity_id     INT NOT NULL,
  lead_score    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status        ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST')
                  NOT NULL DEFAULT 'NEW',
  notes         TEXT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_saved_leads_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  -- Duplicate protection: one saved lead per user per entity
  CONSTRAINT uq_saved_leads_user_entity
    UNIQUE (user_id, entity_type, entity_id),

  -- Common access patterns
  INDEX idx_saved_leads_user (user_id),
  INDEX idx_saved_leads_user_status (user_id, status),
  INDEX idx_saved_leads_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Optional supporting indexes for discovery queries.
-- Only add these if they do not already exist on your buyers /
-- suppliers / shipments tables (check SHOW INDEX FROM <table> first).
-- ------------------------------------------------------------
-- ALTER TABLE buyers      ADD INDEX idx_buyers_country (country);
-- ALTER TABLE buyers      ADD INDEX idx_buyers_hs_code (hs_code);
-- ALTER TABLE buyers      ADD INDEX idx_buyers_verified (verified);
-- ALTER TABLE suppliers   ADD INDEX idx_suppliers_country (country);
-- ALTER TABLE suppliers   ADD INDEX idx_suppliers_hs_code (hs_code);
-- ALTER TABLE suppliers   ADD INDEX idx_suppliers_verified (verified);
-- ALTER TABLE shipments   ADD INDEX idx_shipments_entity (entity_type, entity_id);
-- ALTER TABLE shipments   ADD INDEX idx_shipments_date (shipment_date);
