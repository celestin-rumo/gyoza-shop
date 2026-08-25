ALTER TABLE production_sessions
    ADD COLUMN batch_number VARCHAR(255);

-- Backfill any pre-existing rows with a code derived from their own id, so it stays
-- unique even if several sessions share the same session_date.
UPDATE production_sessions
SET batch_number = 'L' || to_char(session_date, 'YYYYMMDD') || '-' || lpad(id::text, 4, '0')
WHERE batch_number IS NULL;

ALTER TABLE production_sessions
    ALTER COLUMN batch_number SET NOT NULL,
    ADD CONSTRAINT uq_production_sessions_batch_number UNIQUE (batch_number);
