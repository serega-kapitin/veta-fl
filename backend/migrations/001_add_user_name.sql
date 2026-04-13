-- Migration: add `name` column to `user` table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS name VARCHAR;
