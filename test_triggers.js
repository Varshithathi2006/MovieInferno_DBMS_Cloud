const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseFunctions() {
  console.log('🧪 Testing Supabase Triggers and Functions...\n');

  try {
    // Test 1: Check if review_count column exists
    console.log('1️⃣ Testing review_count column existence...');
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('id, title, review_count')
      .limit(1);

    if (moviesError) {
      console.log('❌ review_count column might not exist yet:', moviesError.message);
    } else {
      console.log('✅ review_count column exists and accessible');
      if (movies && movies.length > 0) {
        console.log(`   Sample movie: ${movies[0].title} (review_count: ${movies[0].review_count || 0})`);
      }
    }

    // Test 2: Check if we can access functions (this will fail if functions don't exist)
    console.log('\n2️⃣ Testing database functions accessibility...');
    const { data: functionTest, error: functionError } = await supabase
      .rpc('increment_review_count');

    if (functionError) {
      console.log('❌ Functions not accessible or not created yet:', functionError.message);
    } else {
      console.log('✅ Functions are accessible');
    }

    // Test 3: Test trigger functionality (insert a test review)
    console.log('\n3️⃣ Testing trigger functionality...');
    
    // First, get a movie to test with
    const { data: testMovies, error: testMoviesError } = await supabase
      .from('movies')
      .select('id, title, review_count')
      .limit(1);

    if (testMoviesError || !testMovies || testMovies.length === 0) {
      console.log('❌ No movies found for testing');
      return;
    }

    const testMovie = testMovies[0];
    const initialCount = testMovie.review_count || 0;
    console.log(`   Testing with movie: ${testMovie.title} (initial count: ${initialCount})`);

    // Insert a test review
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        movie_id: testMovie.id,
        user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
        rating: 5,
        review_text: 'Test review for trigger validation',
        created_at: new Date().toISOString()
      })
      .select();

    if (reviewError) {
      console.log('❌ Failed to insert test review:', reviewError.message);
    } else {
      console.log('✅ Test review inserted successfully');
      
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if review count was updated
      const { data: updatedMovie, error: updateError } = await supabase
        .from('movies')
        .select('review_count')
        .eq('id', testMovie.id)
        .single();

      if (updateError) {
        console.log('❌ Failed to check updated review count:', updateError.message);
      } else {
        const newCount = updatedMovie.review_count || 0;
        if (newCount > initialCount) {
          console.log(`✅ Trigger working! Count increased from ${initialCount} to ${newCount}`);
        } else {
          console.log(`❌ Trigger might not be working. Count: ${initialCount} → ${newCount}`);
        }
      }

      // Clean up: Delete the test review
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewData[0].id);

      if (deleteError) {
        console.log('⚠️ Failed to clean up test review:', deleteError.message);
      } else {
        console.log('✅ Test review cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🏁 Supabase function testing completed!');
}

// Run the tests
testSupabaseFunctions().catch(console.error);