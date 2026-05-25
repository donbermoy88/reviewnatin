-- Wave 3a: extend payment_provider enum (must commit before use in next migration)

ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'gcash';
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'maya';
