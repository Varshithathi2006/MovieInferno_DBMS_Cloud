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

async function monitorWatchlistChanges() {
  console.log('👀 Monitoring Watchlist Database Changes...\n');
  console.log('This script will show you the current state of the watchlist table.');
  console.log('You can now use the browser to add/remove items and see the changes here.\n');

  try {
    // Get test user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found or error:', userError);
      return;
    }

    const testUser = users[0];
    console.log(`👤 Monitoring user: ${testUser.username} (ID: ${testUser.id})\n`);

    // Function to display current watchlist
    async function displayCurrentWatchlist() {
      const { data: watchlist, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', testUser.id)
        .order('added_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching watchlist:', error);
        return;
      }

      console.log(`📊 Current watchlist items: ${watchlist.length}`);
      if (watchlist.length > 0) {
        console.log('Items in database:');
        watchlist.forEach((item, index) => {
          const mediaType = item.movie_id > 0 ? 'movie' : 'tv';
          const tmdbId = Math.abs(item.movie_id);
          console.log(`  ${index + 1}. ID: ${item.id}, TMDB ID: ${tmdbId}, Type: ${mediaType}, Added: ${new Date(item.added_date).toLocaleString()}`);
        });
      } else {
        console.log('  No items in watchlist');
      }
      console.log('');
    }

    // Display initial state
    console.log('🔍 Initial state:');
    await displayCurrentWatchlist();

    // Monitor changes every 3 seconds
    console.log('🔄 Monitoring for changes (press Ctrl+C to stop)...\n');
    
    let previousCount = 0;
    const { data: initialWatchlist } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', testUser.id);
    
    previousCount = initialWatchlist ? initialWatchlist.length : 0;

    setInterval(async () => {
      const { data: currentWatchlist, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', testUser.id);

      if (error) {
        console.error('❌ Error monitoring:', error);
        return;
      }

      const currentCount = currentWatchlist ? currentWatchlist.length : 0;
      
      if (currentCount !== previousCount) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`🔔 [${timestamp}] Change detected! Count changed from ${previousCount} to ${currentCount}`);
        
        if (currentCount > previousCount) {
          console.log('➕ Item(s) added to watchlist');
        } else {
          console.log('➖ Item(s) removed from watchlist');
        }
        
        await displayCurrentWatchlist();
        previousCount = currentCount;
      }
    }, 3000);

  } catch (error) {
    console.error('❌ Monitor failed with error:', error);
  }
}

monitorWatchlistChanges();