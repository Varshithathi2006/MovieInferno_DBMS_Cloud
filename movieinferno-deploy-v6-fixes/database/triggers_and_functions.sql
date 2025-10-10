-- MovieInferno Database Triggers and Functions
-- This file contains database-side automation for data integrity and dynamic behavior

-- Add review_count column to movies table if it doesn't exist
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create function to increment review count
CREATE OR REPLACE FUNCTION increment_review_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment the review count for the movie
    UPDATE movies 
    SET review_count = review_count + 1 
    WHERE id = NEW.movie_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement review count
CREATE OR REPLACE FUNCTION decrement_review_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrement the review count for the movie
    UPDATE movies 
    SET review_count = GREATEST(review_count - 1, 0)
    WHERE id = OLD.movie_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle review count updates when rating changes
CREATE OR REPLACE FUNCTION update_review_count_on_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If movie_id changed, decrement old movie and increment new movie
    IF OLD.movie_id != NEW.movie_id THEN
        UPDATE movies 
        SET review_count = GREATEST(review_count - 1, 0)
        WHERE id = OLD.movie_id;
        
        UPDATE movies 
        SET review_count = review_count + 1 
        WHERE id = NEW.movie_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review insertions
DROP TRIGGER IF EXISTS on_review_insert ON reviews;
CREATE TRIGGER on_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION increment_review_count();

-- Create trigger for review deletions
DROP TRIGGER IF EXISTS on_review_delete ON reviews;
CREATE TRIGGER on_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION decrement_review_count();

-- Create trigger for review updates (if movie_id changes)
DROP TRIGGER IF EXISTS on_review_update ON reviews;
CREATE TRIGGER on_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_review_count_on_change();

-- Initialize review counts for existing movies
UPDATE movies 
SET review_count = (
    SELECT COUNT(*) 
    FROM reviews 
    WHERE reviews.movie_id = movies.id
)
WHERE review_count IS NULL OR review_count = 0;

-- Create index for better performance on review_count queries
CREATE INDEX IF NOT EXISTS idx_movies_review_count ON movies(review_count);

-- Comments explaining the trigger system:
-- 
-- This trigger system automatically maintains the review_count column in the movies table:
-- 1. increment_review_count(): Called when a new review is inserted
-- 2. decrement_review_count(): Called when a review is deleted
-- 3. update_review_count_on_change(): Called when a review is updated (handles movie_id changes)
-- 4. Triggers are set up for INSERT, DELETE, and UPDATE operations on the reviews table
-- 5. The system ensures data integrity and eliminates the need for manual count updates
-- 6. Initial counts are calculated for existing movies to ensure consistency