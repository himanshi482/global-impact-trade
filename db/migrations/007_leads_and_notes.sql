-- GlobeBridge schema — leads and lead notes
-- Depends on: 002_core_tables.sql

USE globebridge;

-- ---------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  buyer_id        INT DEFAULT NULL,
  supplier_id     INT DEFAULT NULL,
  status          ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST') NOT NULL DEFAULT 'NEW',
  score           INT DEFAULT 0,
  potential_tier  ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'LOW',
  score_reason    TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_leads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_leads_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
  CONSTRAINT fk_leads_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_buyer (user_id, buyer_id),
  UNIQUE KEY uq_user_supplier (user_id, supplier_id),
  CONSTRAINT chk_lead_type CHECK ((buyer_id IS NOT NULL AND supplier_id IS NULL) OR (buyer_id IS NULL AND supplier_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- lead_notes
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_notes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  lead_id     INT NOT NULL,
  note        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lead_notes_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
