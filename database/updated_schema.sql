-- MovieInferno Database Schema - Updated Version
-- This file contains the enhanced SQL schema for all tables used in the MovieInferno application

-- Users table (enhanced with favorite genre)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    favorite_genre_id INTEGER REFERENCES genres(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movies table (enhanced with trailer_url)
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    release_date DATE,
    poster TEXT,
    synopsis TEXT,
    runtime INTEGER,
    budget BIGINT,
    revenue BIGINT,
    vote_average DECIMAL(3,1),
    vote_count INTEGER,
    trailer_url TEXT,
    backdrop_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TV Shows table (enhanced with trailer_url)
CREATE TABLE IF NOT EXISTS tv_shows (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    first_air_date DATE,
    last_air_date DATE,
    poster_path TEXT,
    overview TEXT,
    number_of_episodes INTEGER,
    number_of_seasons INTEGER,
    vote_average DECIMAL(3,1),
    vote_count INTEGER,
    status VARCHAR(50),
    trailer_url TEXT,
    backdrop_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Genres table
CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movie-Genre relationship table
CREATE TABLE IF NOT EXISTS movie_genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id, genre_id)
);

-- TV Show-Genre relationship table
CREATE TABLE IF NOT EXISTS tv_genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tv_show_id INTEGER REFERENCES tv_shows(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tv_show_id, genre_id)
);

-- Peoples table (NEW - for cast and crew information)
CREATE TABLE IF NOT EXISTS peoples (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255), -- character name or job title
    profile_path TEXT,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    tv_show_id INTEGER REFERENCES tv_shows(id) ON DELETE CASCADE,
    department VARCHAR(100), -- Acting, Directing, Writing, etc.
    job VARCHAR(100), -- Director, Actor, Producer, etc.
    character_name VARCHAR(255), -- for actors
    order_index INTEGER, -- for cast ordering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (movie_id IS NOT NULL OR tv_show_id IS NOT NULL)
);

-- People table (for person details - actors, directors, etc.)
CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INTEGER,
    death_year INTEGER,
    photo TEXT,
    bio TEXT,
    nationality VARCHAR(100),
    known_for_department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    overview TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    tv_show_id INTEGER REFERENCES tv_shows(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (movie_id IS NOT NULL OR tv_show_id IS NOT NULL)
);

-- Watchlist table (main table for watchlist functionality)
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type VARCHAR(10) CHECK (media_type IN ('movie', 'tv')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    poster_path TEXT,
    release_date DATE,
    vote_average DECIMAL(3,1),
    overview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tmdb_id, media_type)
);

-- Chatbot history table
CREATE TABLE IF NOT EXISTS chatbot_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'model')) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movie sync log (NEW - to track TMDB sync operations)
CREATE TABLE IF NOT EXISTS movie_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50) NOT NULL, -- 'popular', 'trending', 'genre', etc.
    movies_synced INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_favorite_genre ON users(favorite_genre_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_media_type ON watchlist(media_type);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON watchlist(created_at);
CREATE INDEX IF NOT EXISTS idx_movie_genres_movie_id ON movie_genres(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_genres_genre_id ON movie_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_tv_genres_tv_show_id ON tv_genres(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_tv_genres_genre_id ON tv_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tv_show_id ON reviews(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_history_user_id ON chatbot_history(user_id);
CREATE INDEX IF NOT EXISTS idx_peoples_movie_id ON peoples(movie_id);
CREATE INDEX IF NOT EXISTS idx_peoples_tv_show_id ON peoples(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_peoples_department ON peoples(department);

-- Migration script to update existing tables
-- Add new columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_genre_id INTEGER REFERENCES genres(id);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS trailer_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS backdrop_path TEXT;
ALTER TABLE tv_shows ADD COLUMN IF NOT EXISTS trailer_url TEXT;
ALTER TABLE tv_shows ADD COLUMN IF NOT EXISTS backdrop_path TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tv_show_id INTEGER REFERENCES tv_shows(id);

-- Add check constraint to reviews table
ALTER TABLE reviews ADD CONSTRAINT reviews_media_check 
CHECK (movie_id IS NOT NULL OR tv_show_id IS NOT NULL);

-- Comments explaining the enhanced schema:
-- 
-- Key Enhancements:
-- 1. Users table now includes username and favorite_genre_id for personalization
-- 2. Movies and TV shows tables include trailer_url for YouTube integration
-- 3. New peoples table for cast and crew information from TMDB credits
-- 4. Reviews table supports both movies and TV shows
-- 5. Movie sync log table to track TMDB synchronization operations
-- 6. Awards table removed as it was unused (can be re-added if needed)
-- 7. Enhanced indexing for better query performance
-- 8. Migration scripts to update existing tables without data loss