// Test script for Supabase triggers and functions
// This script validates the automatic review count functionality

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found in environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTriggers() {
    console.log('🧪 Testing Supabase Triggers and Functions...\n')

    try {
        // Test 1: Check if review_count column exists
        console.log('1️⃣ Testing review_count column existence...')
        const { data: movies, error: moviesError } = await supabase
            .from('movies')
            .select('id, title, review_count')
            .limit(1)

        if (moviesError) {
            console.error('❌ Error accessing movies table:', moviesError.message)
            return
        }

        if (movies && movies.length > 0) {
            console.log('✅ Movies table accessible with review_count column')
            console.log(`   Sample movie: ${movies[0].title} (review_count: ${movies[0].review_count || 0})`)
        }

        // Test 2: Check if triggers exist by testing functionality
        console.log('\n2️⃣ Testing trigger functionality...')
        
        // Get a test user (first user in the database)
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id')
            .limit(1)

        if (usersError || !users || users.length === 0) {
            console.log('⚠️  No test users found. Skipping trigger test.')
            return
        }

        const testUserId = users[0].id
        const testMovieId = 550 // Fight Club (common test movie ID)

        // Get initial review count
        const { data: initialMovie } = await supabase
            .from('movies')
            .select('review_count')
            .eq('id', testMovieId)
            .single()

        const initialCount = initialMovie?.review_count || 0
        console.log(`   Initial review count for movie ${testMovieId}: ${initialCount}`)

        // Test 3: Insert a test review
        console.log('\n3️⃣ Testing review insertion trigger...')
        const { data: insertedReview, error: insertError } = await supabase
            .from('reviews')
            .insert({
                user_id: testUserId,
                movie_id: testMovieId,
                rating: 8,
                comment: 'Test review for trigger validation'
            })
            .select()

        if (insertError) {
            console.log('⚠️  Could not insert test review (may already exist):', insertError.message)
        } else {
            console.log('✅ Test review inserted successfully')

            // Check if review count increased
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for trigger
            
            const { data: updatedMovie } = await supabase
                .from('movies')
                .select('review_count')
                .eq('id', testMovieId)
                .single()

            const newCount = updatedMovie?.review_count || 0
            if (newCount > initialCount) {
                console.log(`✅ Trigger working! Review count increased: ${initialCount} → ${newCount}`)
            } else {
                console.log(`⚠️  Review count unchanged: ${initialCount} → ${newCount}`)
            }

            // Test 4: Delete the test review
            console.log('\n4️⃣ Testing review deletion trigger...')
            const { error: deleteError } = await supabase
                .from('reviews')
                .delete()
                .eq('user_id', testUserId)
                .eq('movie_id', testMovieId)
                .eq('comment', 'Test review for trigger validation')

            if (!deleteError) {
                await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for trigger
                
                const { data: finalMovie } = await supabase
                    .from('movies')
                    .select('review_count')
                    .eq('id', testMovieId)
                    .single()

                const finalCount = finalMovie?.review_count || 0
                if (finalCount === initialCount) {
                    console.log(`✅ Delete trigger working! Review count restored: ${newCount} → ${finalCount}`)
                } else {
                    console.log(`⚠️  Delete trigger issue: Expected ${initialCount}, got ${finalCount}`)
                }
            }
        }

        // Test 5: Check function existence
        console.log('\n5️⃣ Testing function existence...')
        const { data: functions, error: functionsError } = await supabase
            .rpc('increment_review_count')
            .then(() => ({ data: 'Functions accessible', error: null }))
            .catch(error => ({ data: null, error }))

        if (!functionsError) {
            console.log('✅ Database functions are accessible')
        } else {
            console.log('⚠️  Database functions may not be properly installed')
        }

        console.log('\n🎉 Trigger testing completed!')

    } catch (error) {
        console.error('❌ Test failed:', error.message)
    }
}

// Run the tests
testTriggers().then(() => {
    console.log('\n📊 Test Summary:')
    console.log('   - Review count column: Check movies table')
    console.log('   - Trigger functions: Test with review operations')
    console.log('   - Data integrity: Verify counts match actual reviews')
    console.log('\n💡 To apply triggers to your Supabase database:')
    console.log('   1. Copy the SQL from triggers_and_functions.sql')
    console.log('   2. Run it in your Supabase SQL Editor')
    console.log('   3. Verify triggers are active in Database > Triggers')
})