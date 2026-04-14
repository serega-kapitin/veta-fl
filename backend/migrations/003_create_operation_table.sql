-- Migration: create `operation` table
CREATE TABLE IF NOT EXISTS operation (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR NOT NULL,
    flower_id INTEGER NOT NULL REFERENCES flower(id),
    date DATE NOT NULL,
    price_add FLOAT,
    price_subtr FLOAT,
    user_login VARCHAR NOT NULL REFERENCES "user"(login)
);
