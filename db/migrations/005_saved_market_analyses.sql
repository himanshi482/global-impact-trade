-- GlobeBridge schema — saved market intelligence analyses
-- Depends on: 002_core_tables.sql (users)

USE globebridge;

-- ---------------------------------------------------------------------
-- saved_market_analyses
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_market_analyses (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  hs_code            VARCHAR(20),
  country            VARCHAR(100),
  direction          VARCHAR(20) DEFAULT 'export',
  filters            JSON,
  opportunity_score  INT DEFAULT 0,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_market_analyses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_saved_market_analyses_user_id (user_id),
  INDEX idx_saved_market_analyses_hs_country (hs_code, country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
