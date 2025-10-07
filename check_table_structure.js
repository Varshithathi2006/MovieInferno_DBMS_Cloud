// Check actual table structure
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajnkisostsjhoqfyjsqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbmtpc29zdHNqaG9xZnlqc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY0MjQsImV4cCI6MjA3MTk3MjQyNH0.KMvKbgeF2xeCwrFSGXHA0NLqZ9_94kIBs0CiSjkuBkg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Checking actual table structure...\n');

  try {
    // Get all columns from watchlist table
    console.log('1. Checking watchlist table structure...');
    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlist')
      .select('*')
      .limit(1);
    
    if (watchlistError) {
      console.error('❌ Failed to query watchlist table:', watchlistError);
    } else {
      console.log('✅ Watchlist table accessible');
      if (watchlistData.length > 0) {
        console.log('📋 Available columns:', Object.keys(watchlistData[0]));
      } else {
        console.log('📋 Table is empty, trying to get column info differently...');
        
        // Try to insert a test record to see what columns are expected
        const testRecord = {
          user_id: '00000000-0000-0000-0000-000000000000',
          tmdb_id: 999999,
          title: 'Test Movie'
        };
        
        const { error: insertError } = await supabase
          .from('watchlist')
          .insert([testRecord]);
        
        if (insertError) {
          console.log('📋 Insert error reveals expected columns:', insertError.message);
        }
      }
    }
    console.log('');

    // Check what tables are accessible
    console.log('2. Checking accessible tables...');
    const tables = ['movies', 'genres', 'users', 'reviews'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: accessible`);
          if (data.length > 0) {
            console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkTableStructure();