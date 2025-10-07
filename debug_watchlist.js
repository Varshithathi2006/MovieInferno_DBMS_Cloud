// Debug script to test watchlist functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajnkisostsjhoqfyjsqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbmtpc29zdHNqaG9xZnlqc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY0MjQsImV4cCI6MjA3MTk3MjQyNH0.KMvKbgeF2xeCwrFSGXHA0NLqZ9_94kIBs0CiSjkuBkg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWatchlistFunctionality() {
  console.log('🔍 Testing Watchlist Functionality...\n');

  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('watchlist')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    console.log('✅ Database connection successful\n');

    // 2. Check current watchlist entries
    console.log('2. Checking current watchlist entries...');
    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlist')
      .select('*')
      .limit(10);
    
    if (watchlistError) {
      console.error('❌ Failed to fetch watchlist:', watchlistError);
    } else {
      console.log(`✅ Found ${watchlistData.length} watchlist entries:`);
      watchlistData.forEach(item => {
        console.log(`   - ${item.title} (${item.media_type}) - User: ${item.user_id}`);
      });
    }
    console.log('');

    // 3. Check users table
    console.log('3. Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError);
    } else {
      console.log(`✅ Found ${usersData.length} users:`);
      usersData.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
    }
    console.log('');

    // 4. Test adding a TV show to watchlist
    if (usersData && usersData.length > 0) {
      const testUserId = usersData[0].id;
      console.log(`4. Testing TV show addition to watchlist for user: ${testUserId}...`);
      
      const testTVShow = {
        user_id: testUserId,
        tmdb_id: 1399, // Game of Thrones
        media_type: 'tv',
        title: 'Game of Thrones',
        poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
        release_date: '2011-04-17',
        vote_average: 9.3,
        overview: 'Seven noble families fight for control of the mythical land of Westeros.'
      };

      // Check if already exists
      const { data: existingData } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', testUserId)
        .eq('tmdb_id', 1399)
        .eq('media_type', 'tv')
        .single();

      if (existingData) {
        console.log('⚠️  TV show already in watchlist, removing first...');
        await supabase
          .from('watchlist')
          .delete()
          .eq('id', existingData.id);
      }

      // Add to watchlist
      const { data: insertData, error: insertError } = await supabase
        .from('watchlist')
        .insert([testTVShow])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to add TV show to watchlist:', insertError);
      } else {
        console.log('✅ Successfully added TV show to watchlist:', insertData.title);
        
        // Test retrieval
        const { data: retrievedData, error: retrieveError } = await supabase
          .from('watchlist')
          .select('*')
          .eq('user_id', testUserId)
          .eq('media_type', 'tv');

        if (retrieveError) {
          console.error('❌ Failed to retrieve TV shows from watchlist:', retrieveError);
        } else {
          console.log(`✅ Successfully retrieved ${retrievedData.length} TV shows from watchlist`);
        }
      }
    }

    console.log('\n🎉 Watchlist functionality test completed!');

  } catch (error) {
    console.error('💥 Unexpected error during testing:', error);
  }
}

testWatchlistFunctionality();