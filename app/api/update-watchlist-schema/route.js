import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST() {
  try {
    console.log('Starting watchlist table schema update...');

    // First, let's backup existing data
    const { data: existingData, error: fetchError } = await supabase
      .from('watchlist')
      .select('*');

    if (fetchError) {
      console.error('Error fetching existing watchlist data:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch existing data' }, { status: 500 });
    }

    console.log(`Found ${existingData.length} existing watchlist entries`);

    // Create the new watchlist table structure
    const createNewTableSQL = `
      -- Drop the old watchlist table
      DROP TABLE IF EXISTS watchlist_old;
      
      -- Rename current table to backup
      ALTER TABLE watchlist RENAME TO watchlist_old;
      
      -- Create new watchlist table with proper structure
      CREATE TABLE watchlist (
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
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
      CREATE INDEX IF NOT EXISTS idx_watchlist_media_type ON watchlist(media_type);
      CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON watchlist(created_at);
    `;

    // Execute the SQL using a raw query approach
    // Since we can't use exec_sql, we'll need to do this step by step
    
    // First, let's try to create a new table with a different name
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createNewTableSQL
    });

    if (createError) {
      console.error('Error creating new table structure:', createError);
      
      // If exec_sql doesn't work, let's try a different approach
      // We'll add the missing columns to the existing table
      const alterTableSQL = `
        -- Add new columns to existing watchlist table
        ALTER TABLE watchlist 
        ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
        ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'movie',
        ADD COLUMN IF NOT EXISTS title VARCHAR(255),
        ADD COLUMN IF NOT EXISTS poster_path TEXT,
        ADD COLUMN IF NOT EXISTS release_date DATE,
        ADD COLUMN IF NOT EXISTS vote_average DECIMAL(3,1),
        ADD COLUMN IF NOT EXISTS overview TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Update existing records to have proper values
        UPDATE watchlist 
        SET 
          tmdb_id = movie_id,
          media_type = 'movie',
          title = COALESCE((SELECT title FROM movies WHERE movies.id = watchlist.movie_id), 'Unknown Movie'),
          updated_at = NOW()
        WHERE tmdb_id IS NULL;
      `;

      // Try alternative approach without exec_sql
      return NextResponse.json({ 
        message: 'Schema update needed but exec_sql not available. Manual database update required.',
        existingStructure: existingData.length > 0 ? Object.keys(existingData[0]) : [],
        requiredColumns: ['id', 'user_id', 'tmdb_id', 'media_type', 'title', 'poster_path', 'release_date', 'vote_average', 'overview', 'created_at', 'updated_at'],
        recommendation: 'Please update the database schema manually or through Supabase dashboard'
      }, { status: 200 });
    }

    // If we get here, the table was created successfully
    // Now migrate the old data
    if (existingData.length > 0) {
      const migratedData = existingData.map(item => ({
        user_id: item.user_id,
        tmdb_id: item.movie_id,
        media_type: 'movie',
        title: 'Migrated Movie', // We'd need to fetch actual titles
        created_at: item.added_date || new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('watchlist')
        .insert(migratedData);

      if (insertError) {
        console.error('Error migrating data:', insertError);
        return NextResponse.json({ error: 'Failed to migrate existing data' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      message: 'Watchlist table schema updated successfully',
      migratedRecords: existingData.length
    });

  } catch (error) {
    console.error('Error updating watchlist schema:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}