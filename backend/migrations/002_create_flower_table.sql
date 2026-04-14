-- Migration: create `flower` table
CREATE TABLE IF NOT EXISTS flower (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    foto BYTEA,
    buy_price FLOAT,
    buy_date DATE,
    sell_price FLOAT,
    sell_date DATE
);
