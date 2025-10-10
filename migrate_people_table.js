require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migratePeopleTable() {
  console.log('🎬 Starting People Table Migration to Match TMDB Structure...\n');

  try {
    // Step 1: Check if the current people table exists and has data
    console.log('1. Checking current people table...');
    const { data: currentPeople, error: checkError } = await supabase
      .from('people')
      .select('*')
      .limit(5);

    if (checkError) {
      console.log('   No existing people table found or accessible');
    } else {
      console.log(`   Found ${currentPeople?.length || 0} sample records in current people table`);
      if (currentPeople && currentPeople.length > 0) {
        console.log('   Sample record structure:', Object.keys(currentPeople[0]));
      }
    }

    // Step 2: Create the new enhanced people table structure
    console.log('\n2. Creating enhanced people table structure...');
    
    const createTableSQL = `
      -- Create enhanced people table with TMDB-aligned structure
      CREATE TABLE IF NOT EXISTS people_enhanced (
          -- Core identification fields
          id INTEGER PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          original_name VARCHAR(255),
          
          -- Biographical information
          biography TEXT,
          birthday DATE,
          deathday DATE,
          place_of_birth TEXT,
          
          -- Professional information
          known_for_department VARCHAR(100),
          gender INTEGER,
          adult BOOLEAN DEFAULT FALSE,
          
          -- Media and popularity
          profile_path TEXT,
          popularity DECIMAL(10,3) DEFAULT 0,
          
          -- External references
          imdb_id VARCHAR(20),
          homepage TEXT,
          also_known_as TEXT[],
          
          -- Metadata
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Note: We can't execute DDL directly through Supabase client
    console.log('   ⚠️  DDL commands need to be run manually in Supabase SQL Editor');
    console.log('   📋 SQL to create enhanced table:');
    console.log(createTableSQL);

    // Step 3: Prepare data migration logic
    console.log('\n3. Preparing data migration...');
    
    if (currentPeople && currentPeople.length > 0) {
      console.log('   📊 Migration mapping:');
      console.log('   • id → id (unchanged)');
      console.log('   • name → name (unchanged)');
      console.log('   • bio → biography');
      console.log('   • birth_year → birthday (convert year to date)');
      console.log('   • death_year → deathday (convert year to date)');
      console.log('   • photo → profile_path');
      console.log('   • nationality → place_of_birth');
      console.log('   • known_for_department → known_for_department (unchanged)');
      console.log('   • New fields: gender, popularity, adult, imdb_id, homepage, also_known_as');

      // Show sample migration for first record
      const sample = currentPeople[0];
      console.log('\n   📝 Sample migration for first record:');
      console.log('   Old:', sample);
      
      const migrated = {
        id: sample.id,
        name: sample.name,
        original_name: sample.name,
        biography: sample.bio || null,
        birthday: sample.birth_year ? `${sample.birth_year}-01-01` : null,
        deathday: sample.death_year ? `${sample.death_year}-01-01` : null,
        place_of_birth: sample.nationality || null,
        known_for_department: sample.known_for_department || 'Acting',
        profile_path: sample.photo || null,
        gender: null, // Will be populated from TMDB
        popularity: 0, // Will be populated from TMDB
        adult: false,
        imdb_id: null, // Will be populated from TMDB
        homepage: null, // Will be populated from TMDB
        also_known_as: null // Will be populated from TMDB
      };
      
      console.log('   New:', migrated);
    }

    // Step 4: Create indexes SQL
    console.log('\n4. Index creation SQL:');
    const indexSQL = `
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_people_enhanced_name ON people_enhanced(name);
      CREATE INDEX IF NOT EXISTS idx_people_enhanced_known_for_department ON people_enhanced(known_for_department);
      CREATE INDEX IF NOT EXISTS idx_people_enhanced_popularity ON people_enhanced(popularity DESC);
      CREATE INDEX IF NOT EXISTS idx_people_enhanced_gender ON people_enhanced(gender);
      CREATE INDEX IF NOT EXISTS idx_people_enhanced_birthday ON people_enhanced(birthday);
      CREATE INDEX IF NOT EXISTS idx_people_enhanced_imdb_id ON people_enhanced(imdb_id);
    `;
    console.log(indexSQL);

    // Step 5: Provide complete migration instructions
    console.log('\n5. 📋 Complete Migration Instructions:');
    console.log('   To complete this migration, run the following in Supabase SQL Editor:');
    console.log('\n   A. Create the enhanced table:');
    console.log('   ```sql');
    console.log(createTableSQL);
    console.log('   ```');
    
    console.log('\n   B. Create indexes:');
    console.log('   ```sql');
    console.log(indexSQL);
    console.log('   ```');

    if (currentPeople && currentPeople.length > 0) {
      console.log('\n   C. Migrate existing data:');
      console.log('   ```sql');
      console.log(`
      INSERT INTO people_enhanced (
          id, name, original_name, biography, birthday, deathday, 
          place_of_birth, known_for_department, profile_path, created_at
      )
      SELECT 
          id,
          name,
          name as original_name,
          bio as biography,
          CASE 
              WHEN birth_year IS NOT NULL THEN 
                  MAKE_DATE(birth_year, 1, 1)
              ELSE NULL 
          END as birthday,
          CASE 
              WHEN death_year IS NOT NULL THEN 
                  MAKE_DATE(death_year, 1, 1)
              ELSE NULL 
          END as deathday,
          nationality as place_of_birth,
          known_for_department,
          photo as profile_path,
          created_at
      FROM people;
      `);
      console.log('   ```');

      console.log('\n   D. After successful migration, replace the old table:');
      console.log('   ```sql');
      console.log('   DROP TABLE people CASCADE;');
      console.log('   ALTER TABLE people_enhanced RENAME TO people;');
      console.log('   ```');
    }

    console.log('\n✅ Migration preparation completed!');
    console.log('📝 Next steps:');
    console.log('   1. Run the SQL commands above in Supabase SQL Editor');
    console.log('   2. Update the cast sync API to use enhanced_route.js');
    console.log('   3. Test the new people table with TMDB data sync');

  } catch (error) {
    console.error('❌ Migration preparation failed:', error);
  }
}

migratePeopleTable();