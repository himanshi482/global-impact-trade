-- GlobeBridge schema — user activity, subscriptions, and form submissions
-- Depends on: 002_core_tables.sql (users, buyers, suppliers)

USE globebridge;

-- ---------------------------------------------------------------------
-- search_history
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_history (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  search_type  VARCHAR(50) NOT NULL,       -- e.g. 'buyer', 'supplier', 'hs-code'
  query        VARCHAR(255),
  filters      JSON,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_search_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_search_history_user_id (user_id),
  INDEX idx_search_history_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- saved_searches
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_searches (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  name         VARCHAR(150) NOT NULL,
  search_type  VARCHAR(50) NOT NULL,
  query        VARCHAR(255),
  filters      JSON,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_searches_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_saved_searches_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- contact_requests
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_requests (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  company     VARCHAR(255),
  message     TEXT,
  status      ENUM('NEW', 'CONTACTED', 'CLOSED') NOT NULL DEFAULT 'NEW',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contact_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- demo_requests
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS demo_requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  company         VARCHAR(255),
  phone           VARCHAR(50),
  preferred_date  DATE,
  message         TEXT,
  status          ENUM('NEW', 'CONTACTED', 'CLOSED') NOT NULL DEFAULT 'NEW',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_demo_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  plan        ENUM('FREE', 'PROFESSIONAL', 'ENTERPRISE') NOT NULL DEFAULT 'FREE',
  status      ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  start_date  DATE NOT NULL,
  end_date    DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_subscriptions_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- unlock_requests
-- One row per user unlocking one buyer OR one supplier contact (exactly
-- one of buyer_id / supplier_id is set — enforced in application code,
-- since MySQL CHECK constraints referencing two nullable FKs are awkward).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS unlock_requests (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  buyer_id     INT,
  supplier_id  INT,
  status       ENUM('PENDING', 'GRANTED', 'DENIED') NOT NULL DEFAULT 'PENDING',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_unlock_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_unlock_requests_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
  CONSTRAINT fk_unlock_requests_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  INDEX idx_unlock_requests_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- export_readiness_results
-- Not in the original spec's model list by this exact name, but section 16
-- requires storing assessment results (user, answers, score, tier, date) —
-- this is that table.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS export_readiness_results (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  answers         JSON NOT NULL,
  total_score     INT NOT NULL,
  readiness_tier  VARCHAR(50) NOT NULL,
  category_scores JSON,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_export_readiness_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_export_readiness_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
