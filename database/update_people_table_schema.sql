-- Updated People Table Schema to Match TMDB Data Structure
-- This script updates the existing people table to better align with TMDB API data

-- First, let's backup the existing data (if any)
-- CREATE TABLE people_backup AS SELECT * FROM people;

-- Drop the existing people table (be careful - this will lose data!)
-- DROP TABLE IF EXISTS people CASCADE;

-- Create the updated people table with TMDB-aligned structure
CREATE TABLE IF NOT EXISTS people_new (
    -- Core identification fields
    id INTEGER PRIMARY KEY,                    -- TMDB person ID
    name VARCHAR(255) NOT NULL,               -- Person's name
    original_name VARCHAR(255),               -- Original name (for international actors)
    
    -- Biographical information
    biography TEXT,                           -- Full biography from TMDB
    birthday DATE,                           -- Birth date (YYYY-MM-DD format)
    deathday DATE,                          -- Death date (if applicable)
    place_of_birth TEXT,                    -- Birth location
    
    -- Professional information
    known_for_department VARCHAR(100),       -- Primary department (Acting, Directing, etc.)
    gender INTEGER,                         -- Gender (1=Female, 2=Male, 3=Non-binary)
    adult BOOLEAN DEFAULT FALSE,            -- Adult content flag
    
    -- Media and popularity
    profile_path TEXT,                      -- Profile image path from TMDB
    popularity DECIMAL(10,3),               -- TMDB popularity score
    
    -- External references
    imdb_id VARCHAR(20),                    -- IMDb ID
    homepage TEXT,                          -- Official homepage URL
    also_known_as TEXT[],                   -- Array of alternative names
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_people_name ON people_new(name);
CREATE INDEX IF NOT EXISTS idx_people_known_for_department ON people_new(known_for_department);
CREATE INDEX IF NOT EXISTS idx_people_popularity ON people_new(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_people_gender ON people_new(gender);
CREATE INDEX IF NOT EXISTS idx_people_birthday ON people_new(birthday);

-- Migration script to transfer data from old table to new table
-- This maps the old fields to new fields where possible
INSERT INTO people_new (
    id, 
    name, 
    biography, 
    birthday, 
    deathday, 
    place_of_birth, 
    known_for_department, 
    profile_path,
    created_at
)
SELECT 
    p.id,
    p.name,
    COALESCE(p.bio, '') as biography,
    CASE 
        WHEN p.birth_year IS NOT NULL THEN 
            MAKE_DATE(p.birth_year::INTEGER, 1, 1)  -- Convert year to date (Jan 1st)
        ELSE NULL 
    END as birthday,
    CASE 
        WHEN p.death_year IS NOT NULL THEN 
            MAKE_DATE(p.death_year::INTEGER, 1, 1)  -- Convert year to date (Jan 1st)
        ELSE NULL 
    END as deathday,
    COALESCE(p.nationality, '') as place_of_birth,  -- Map nationality to place_of_birth
    COALESCE(p.known_for_department, 'Acting') as known_for_department,  -- Default to Acting
    COALESCE(p.photo, '') as profile_path,
    NOW() as created_at  -- Use current timestamp since old table might not have this column
FROM people p
WHERE EXISTS (SELECT 1 FROM people LIMIT 1);  -- Only run if old table exists

-- After successful migration, rename tables
-- DROP TABLE people;
-- ALTER TABLE people_new RENAME TO people;

-- Update the peoples table foreign key reference if needed
-- ALTER TABLE peoples DROP CONSTRAINT IF EXISTS peoples_person_id_fkey;
-- ALTER TABLE peoples ADD CONSTRAINT peoples_person_id_fkey 
--     FOREIGN KEY (person_id) REFERENCES people(id);

-- Verification queries
SELECT 'Migration completed. New people table structure:' as status;

-- Check table structure (alternative to \d command)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'people_new' 
ORDER BY ordinal_position;

SELECT 'Sample data from new table:' as status;
SELECT id, name, birthday, place_of_birth, known_for_department, popularity 
FROM people_new 
LIMIT 5;