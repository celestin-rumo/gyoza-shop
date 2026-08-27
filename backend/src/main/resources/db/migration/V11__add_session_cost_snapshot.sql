ALTER TABLE raw_material_usages
    ADD COLUMN unit_cost NUMERIC,
    ADD COLUMN target_product_id BIGINT REFERENCES products(id);

UPDATE raw_material_usages SET unit_cost = 0 WHERE unit_cost IS NULL;

ALTER TABLE raw_material_usages
    ALTER COLUMN unit_cost SET NOT NULL;

ALTER TABLE product_outputs
    ADD COLUMN unit_sale_price NUMERIC;

UPDATE product_outputs SET unit_sale_price = 0 WHERE unit_sale_price IS NULL;

ALTER TABLE product_outputs
    ALTER COLUMN unit_sale_price SET NOT NULL;

ALTER TABLE production_sessions
    ADD COLUMN other_costs NUMERIC NOT NULL DEFAULT 0;
