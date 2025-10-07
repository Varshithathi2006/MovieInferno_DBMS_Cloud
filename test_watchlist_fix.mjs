import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Manually load environment variables from .env.local
let supabaseUrl, supabaseAnonKey;

try {
  const envContent = readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('❌ Could not read .env.local file:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWatchlistFunctionality() {
  console.log('🧪 Testing updated watchlist functionality...\n');

  try {
    // Test 1: Check database connection
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

    // Test 2: Get a test user
    console.log('2. Getting test user...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('❌ No users found or error:', userError);
      return;
    }
    
    const testUserId = users[0].id;
    console.log(`✅ Using test user ID: ${testUserId}\n`);

    // Test 3: Add a TV show to watchlist (using negative ID approach)
    console.log('3. Testing TV show addition to watchlist...');
    const tvShowData = {
      user_id: testUserId,
      movie_id: -1399, // Negative ID for Game of Thrones (TMDB ID: 1399)
      added_date: new Date().toISOString()
    };

    // First, remove if exists
    await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', testUserId)
      .eq('movie_id', -1399);

    const { data: insertData, error: insertError } = await supabase
      .from('watchlist')
      .insert([tvShowData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to add TV show:', insertError);
      return;
    }
    console.log('✅ TV show added successfully:', insertData);

    // Test 4: Check if TV show is in watchlist
    console.log('\n4. Testing TV show watchlist check...');
    const { data: checkData, error: checkError } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', testUserId)
      .eq('movie_id', -1399)
      .single();

    if (checkError) {
      console.error('❌ Failed to check TV show:', checkError);
      return;
    }
    console.log('✅ TV show found in watchlist:', checkData);

    // Test 5: Add a movie to watchlist (using positive ID)
    console.log('\n5. Testing movie addition to watchlist...');
    const movieData = {
      user_id: testUserId,
      movie_id: 550, // Fight Club (TMDB ID: 550)
      added_date: new Date().toISOString()
    };

    // First, remove if exists
    await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', testUserId)
      .eq('movie_id', 550);

    const { data: movieInsertData, error: movieInsertError } = await supabase
      .from('watchlist')
      .insert([movieData])
      .select()
      .single();

    if (movieInsertError) {
      console.error('❌ Failed to add movie:', movieInsertError);
      return;
    }
    console.log('✅ Movie added successfully:', movieInsertData);

    // Test 6: Get all watchlist items for user
    console.log('\n6. Testing watchlist retrieval...');
    const { data: allWatchlist, error: allError } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', testUserId);

    if (allError) {
      console.error('❌ Failed to get watchlist:', allError);
      return;
    }

    console.log('✅ User watchlist items:');
    allWatchlist.forEach(item => {
      const isMovie = item.movie_id > 0;
      const tmdbId = Math.abs(item.movie_id);
      console.log(`  - ${isMovie ? 'Movie' : 'TV Show'} (TMDB ID: ${tmdbId})`);
    });

    // Test 7: Remove TV show from watchlist
    console.log('\n7. Testing TV show removal...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', testUserId)
      .eq('movie_id', -1399)
      .select();

    if (deleteError) {
      console.error('❌ Failed to remove TV show:', deleteError);
      return;
    }
    console.log('✅ TV show removed successfully:', deleteData);

    console.log('\n🎉 All tests passed! The watchlist functionality should now work for both movies and TV shows.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testWatchlistFunctionality();