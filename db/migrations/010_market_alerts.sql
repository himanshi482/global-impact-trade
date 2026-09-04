USE globebridge;

CREATE TABLE IF NOT EXISTS market_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  alert_type ENUM('HS_CODE', 'COUNTRY', 'OPPORTUNITY_SCORE', 'BUYER_ACTIVITY', 'SHIPMENT_ACTIVITY', 'RISK_LEVEL') NOT NULL,
  criteria JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_market_alerts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_market_alerts_user_active (user_id, is_active),
  INDEX idx_market_alerts_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
