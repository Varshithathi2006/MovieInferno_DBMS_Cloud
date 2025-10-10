require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check if users table exists and get its structure
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying users table:', error.message);
      return;
    }
    
    console.log('Users table exists. Sample data structure:');
    if (data && data.length > 0) {
      console.log('Columns in users table:', Object.keys(data[0]));
      
      // Check specifically for favorite_genre_id
      if ('favorite_genre_id' in data[0]) {
        console.log('✅ favorite_genre_id column exists');
      } else {
        console.log('❌ favorite_genre_id column is missing');
      }
    } else {
      console.log('No users found in the table');
    }
    
    // Also check genres table
    const { data: genresData, error: genresError } = await supabase
      .from('genres')
      .select('*')
      .limit(5);
    
    if (genresError) {
      console.error('Error querying genres table:', genresError.message);
    } else {
      console.log('Genres table exists with', genresData.length, 'sample records');
      if (genresData.length > 0) {
        console.log('Sample genre:', genresData[0]);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSchema();