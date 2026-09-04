USE globebridge;

ALTER TABLE saved_leads
  ADD COLUMN next_follow_up_at DATETIME NULL,
  ADD COLUMN last_contacted_at DATETIME NULL,
  ADD INDEX idx_saved_leads_follow_up (user_id, next_follow_up_at);
