require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Checking current schema...');
    
    // First verify the column doesn't exist
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('favorite_genre_id')
      .limit(1);
    
    if (testError) {
      if (testError.message.includes('column') && testError.message.includes('favorite_genre_id') && testError.message.includes('does not exist')) {
        console.log('✅ Confirmed: favorite_genre_id column does not exist');
        console.log('');
        console.log('🔧 MANUAL MIGRATION REQUIRED:');
        console.log('Please go to your Supabase Dashboard > SQL Editor and run:');
        console.log('');
        console.log('ALTER TABLE users ADD COLUMN favorite_genre_id INTEGER REFERENCES genres(id);');
        console.log('CREATE INDEX idx_users_favorite_genre_id ON users(favorite_genre_id);');
        console.log('');
        console.log('Steps:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Paste the SQL above');
        console.log('5. Click "Run"');
        console.log('');
        console.log('After running the SQL, the profile update should work correctly.');
      } else {
        console.error('Unexpected error:', testError.message);
      }
    } else {
      console.log('✅ favorite_genre_id column already exists');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

applyMigration();