-- GlobeBridge schema — auth tokens
-- One table, discriminated by `purpose`, backs both password reset links
-- and (future) email verification / OTP codes — simpler than a separate
-- table per flow for a project this size, per the "don't over-engineer"
-- guidance in the spec.

USE globebridge;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  token_hash   VARCHAR(255) NOT NULL,   -- SHA-256 of the raw token; raw value is never stored
  purpose      ENUM('PASSWORD_RESET', 'EMAIL_VERIFICATION') NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  used_at      TIMESTAMP NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_auth_tokens_token_hash (token_hash),
  INDEX idx_auth_tokens_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
