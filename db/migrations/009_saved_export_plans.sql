-- ============================================================
-- Migration 009: saved_export_plans
-- Stage 3 Phase 3 — Export Decision Support
--
-- IMPORTANT: hs_code is VARCHAR(20) — NEVER INT — to preserve
-- leading-zero HS codes such as "010121".
-- ============================================================

USE globebridge;

CREATE TABLE IF NOT EXISTS saved_export_plans (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,

  -- Human-readable label the user gives this plan
  name             VARCHAR(255) NOT NULL DEFAULT 'Untitled Plan',

  -- Core identifiers stored as strings to preserve leading zeros
  product          VARCHAR(255),
  hs_code          VARCHAR(20),           -- ALWAYS VARCHAR — see header
  origin_country   VARCHAR(100),
  target_country   VARCHAR(100),

  -- Raw form inputs saved as JSON for rerun support
  input_data       JSON NOT NULL,

  -- Computed analysis snapshot stored as JSON
  analysis_result  JSON,

  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_saved_export_plans_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  -- Common access patterns
  INDEX idx_sep_user          (user_id),
  INDEX idx_sep_user_created  (user_id, created_at),
  INDEX idx_sep_hs_code       (hs_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
