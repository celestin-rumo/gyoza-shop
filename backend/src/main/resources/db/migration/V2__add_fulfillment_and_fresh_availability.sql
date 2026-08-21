ALTER TABLE customers ALTER COLUMN address DROP NOT NULL;

ALTER TABLE customer_orders
    ADD COLUMN fulfillment_method VARCHAR(255) NOT NULL DEFAULT 'PICKUP',
    ADD COLUMN slot               VARCHAR(255) NOT NULL DEFAULT 'A_DEFINIR',
    ADD COLUMN content_type       VARCHAR(255) NOT NULL DEFAULT 'FROZEN';

ALTER TABLE customer_orders ALTER COLUMN fulfillment_method DROP DEFAULT;
ALTER TABLE customer_orders ALTER COLUMN slot DROP DEFAULT;
ALTER TABLE customer_orders ALTER COLUMN content_type DROP DEFAULT;

CREATE TABLE fresh_availability (
    id                 BIGINT PRIMARY KEY,
    next_batch_date    DATE,
    order_window_open  BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO fresh_availability (id, next_batch_date, order_window_open) VALUES (1, NULL, FALSE);
