ALTER TABLE raw_material_purchases
    ADD COLUMN origin_country VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN store          VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN batch_number   VARCHAR(255);

ALTER TABLE raw_material_purchases
    ALTER COLUMN origin_country DROP DEFAULT,
    ALTER COLUMN store DROP DEFAULT;
