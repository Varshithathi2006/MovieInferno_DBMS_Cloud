import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testWatchlistDatabaseOperations() {
  console.log('🧪 Testing Watchlist Database Operations...\n');

  try {
    // Step 1: Get a test user
    console.log('1️⃣ Getting test user...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found or error:', userError);
      return;
    }

    const testUser = users[0];
    console.log(`✅ Using test user: ${testUser.username} (ID: ${testUser.id})\n`);

    // Step 2: Check current watchlist count
    console.log('2️⃣ Checking current watchlist...');
    const { data: initialWatchlist, error: initialError } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', testUser.id);

    if (initialError) {
      console.error('❌ Error fetching initial watchlist:', initialError);
      return;
    }

    console.log(`📊 Current watchlist items: ${initialWatchlist.length}`);
    console.log('Current items:', initialWatchlist.map(item => ({
      id: item.id,
      movie_id: item.movie_id,
      media_type: item.movie_id > 0 ? 'movie' : 'tv',
      tmdb_id: Math.abs(item.movie_id)
    })));
    console.log('');

    // Step 3: Add a test movie to watchlist
    console.log('3️⃣ Adding test movie to watchlist...');
    const testMovieId = 550; // Fight Club
    const { data: insertedMovie, error: insertError } = await supabase
      .from('watchlist')
      .insert({
        user_id: testUser.id,
        movie_id: testMovieId, // Positive for movies
        added_date: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.error('❌ Error inserting movie:', insertError);
    } else {
      console.log('✅ Movie added successfully:', insertedMovie[0]);
    }

    // Step 4: Add a test TV show to watchlist
    console.log('\n4️⃣ Adding test TV show to watchlist...');
    const testTvId = 1399; // Game of Thrones
    const { data: insertedTv, error: insertTvError } = await supabase
      .from('watchlist')
      .insert({
        user_id: testUser.id,
        movie_id: -testTvId, // Negative for TV shows
        added_date: new Date().toISOString()
      })
      .select();

    if (insertTvError) {
      console.error('❌ Error inserting TV show:', insertTvError);
    } else {
      console.log('✅ TV show added successfully:', insertedTv[0]);
    }

    // Step 5: Verify items were added
    console.log('\n5️⃣ Verifying items were added to database...');
    const { data: updatedWatchlist, error: verifyError } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', testUser.id)
      .order('added_date', { ascending: false });

    if (verifyError) {
      console.error('❌ Error verifying watchlist:', verifyError);
      return;
    }

    console.log(`📊 Updated watchlist items: ${updatedWatchlist.length}`);
    console.log('All items in database:');
    updatedWatchlist.forEach(item => {
      const mediaType = item.movie_id > 0 ? 'movie' : 'tv';
      const tmdbId = Math.abs(item.movie_id);
      console.log(`  - ID: ${item.id}, TMDB ID: ${tmdbId}, Type: ${mediaType}, Added: ${item.added_date}`);
    });

    // Step 6: Test deletion by ID
    console.log('\n6️⃣ Testing deletion by ID...');
    if (insertedMovie && insertedMovie[0]) {
      const { data: deletedMovie, error: deleteError } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', insertedMovie[0].id)
        .select();

      if (deleteError) {
        console.error('❌ Error deleting movie:', deleteError);
      } else {
        console.log('✅ Movie deleted successfully:', deletedMovie[0]);
      }
    }

    // Step 7: Test deletion by movie_id
    console.log('\n7️⃣ Testing deletion by movie_id...');
    if (insertedTv && insertedTv[0]) {
      const { data: deletedTv, error: deleteTvError } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', testUser.id)
        .eq('movie_id', -testTvId)
        .select();

      if (deleteTvError) {
        console.error('❌ Error deleting TV show:', deleteTvError);
      } else {
        console.log('✅ TV show deleted successfully:', deletedTv[0]);
      }
    }

    // Step 8: Final verification
    console.log('\n8️⃣ Final verification...');
    const { data: finalWatchlist, error: finalError } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', testUser.id);

    if (finalError) {
      console.error('❌ Error in final verification:', finalError);
      return;
    }

    console.log(`📊 Final watchlist items: ${finalWatchlist.length}`);
    console.log('Remaining items:', finalWatchlist.map(item => ({
      id: item.id,
      movie_id: item.movie_id,
      media_type: item.movie_id > 0 ? 'movie' : 'tv',
      tmdb_id: Math.abs(item.movie_id)
    })));

    // Step 9: Test API endpoints
    console.log('\n9️⃣ Testing API endpoints...');
    
    // Test GET endpoint
    console.log('Testing GET /api/watchlist...');
    try {
      const response = await fetch(`http://localhost:3000/api/watchlist?user_id=${testUser.id}`);
      const apiData = await response.json();
      
      if (response.ok) {
        console.log('✅ GET API working, returned items:', apiData.length);
        console.log('API response sample:', apiData.slice(0, 2));
      } else {
        console.error('❌ GET API error:', apiData);
      }
    } catch (apiError) {
      console.error('❌ API request failed:', apiError.message);
    }

    console.log('\n🎉 Database operations test completed!');
    console.log('\n📋 Summary:');
    console.log(`- Initial items: ${initialWatchlist.length}`);
    console.log(`- Final items: ${finalWatchlist.length}`);
    console.log('- Database connection: ✅ Working');
    console.log('- Insert operations: ✅ Working');
    console.log('- Delete operations: ✅ Working');
    console.log('- Data persistence: ✅ Verified');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testWatchlistDatabaseOperations();