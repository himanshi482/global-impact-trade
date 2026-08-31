-- ---------------------------------------------------------------------
-- Fix subscriptions.plan to match the actual pricing tiers shown on the
-- /plans-pricing page (Free Explorer Trial, Growth, Connect Pro, Conquer)
-- instead of the placeholder FREE/PROFESSIONAL/ENTERPRISE values that
-- lib/limits.js never actually granted quota for.
-- ---------------------------------------------------------------------

ALTER TABLE subscriptions MODIFY COLUMN plan VARCHAR(50) NOT NULL DEFAULT 'FREE';
UPDATE subscriptions SET plan = 'GROWTH'  WHERE plan = 'PROFESSIONAL';
UPDATE subscriptions SET plan = 'CONQUER' WHERE plan = 'ENTERPRISE';
ALTER TABLE subscriptions MODIFY COLUMN plan ENUM('FREE', 'GROWTH', 'CONNECT', 'CONQUER') NOT NULL DEFAULT 'FREE';
