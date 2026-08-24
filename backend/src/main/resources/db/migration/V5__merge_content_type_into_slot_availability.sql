ALTER TABLE slot_availability ADD COLUMN content_type VARCHAR(255) NOT NULL DEFAULT 'FROZEN';
ALTER TABLE slot_availability ALTER COLUMN content_type DROP DEFAULT;

DROP TABLE content_availability;
