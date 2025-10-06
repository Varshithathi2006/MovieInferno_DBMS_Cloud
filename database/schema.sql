-- MovieInferno Database Schema
-- This file contains the SQL schema for all tables used in the MovieInferno application

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movies table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TV Shows table
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

-- People table (actors, directors, etc.)
CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INTEGER,
    death_year INTEGER,
    photo TEXT,
    bio TEXT,
    nationality VARCHAR(100),
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
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, movie_id)
);

-- Awards table
CREATE TABLE IF NOT EXISTS awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    award_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    year INTEGER,
    won BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    role VARCHAR(20) CHECK (role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_media_type ON watchlist(media_type);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON watchlist(created_at);
CREATE INDEX IF NOT EXISTS idx_movie_genres_movie_id ON movie_genres(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_genres_genre_id ON movie_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_tv_genres_tv_show_id ON tv_genres(tv_show_id);
CREATE INDEX IF NOT EXISTS idx_tv_genres_genre_id ON tv_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_history_user_id ON chatbot_history(user_id);

-- Comments explaining the watchlist table structure:
-- 
-- The watchlist table is designed to store both movies and TV shows that users want to watch later.
-- Key features:
-- 1. user_id: Links to the authenticated user
-- 2. tmdb_id: The ID from TMDB API (can be movie or TV show)
-- 3. media_type: Distinguishes between 'movie' and 'tv' content
-- 4. title: Display name for the content
-- 5. poster_path: URL to the poster image
-- 6. release_date: When the content was released
-- 7. vote_average: TMDB rating
-- 8. overview: Brief description
-- 9. created_at/updated_at: Timestamps for tracking
-- 10. Unique constraint prevents duplicate entries for same user/content