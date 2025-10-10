-- Migration: Add favorite_genre_id column to users table
-- Date: 2025-01-10
-- Description: Adds favorite genre functionality to user profiles

-- Add favorite_genre_id column to users table
ALTER TABLE users ADD COLUMN favorite_genre_id INTEGER REFERENCES genres(id);

-- Create index for better performance
CREATE INDEX idx_users_favorite_genre_id ON users(favorite_genre_id);

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'favorite_genre_id';