USE globebridge;

ALTER TABLE unlock_requests
  ADD COLUMN entity_key VARCHAR(50) NULL;

UPDATE unlock_requests
SET entity_key = CONCAT(COALESCE(buyer_id, 0), ':', COALESCE(supplier_id, 0))
WHERE entity_key IS NULL;

ALTER TABLE unlock_requests
  MODIFY COLUMN entity_key VARCHAR(50) NOT NULL,
  ADD UNIQUE KEY uq_unlock_user_entity (user_id, entity_key);
