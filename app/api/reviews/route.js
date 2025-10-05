// app/api/reviews/route.js (Simplified Logic)

import { supabase } from "../../../lib/supabaseClient";

// NOTE: Use your established test ID or fetch the real user ID securely
const TEST_USER_ID = '00a4d6a7-4f64-41b1-ba41-1e0acc587677'; 

export async function POST(request) {
    try {
        const { movieId, rating, comment } = await request.json();

        // Check for existing review by this user/movie to prevent duplicates (optional)

        const { error } = await supabase
            .from('reviews')
            .insert({ 
                user_id: TEST_USER_ID, 
                movie_id: movieId, 
                rating: rating,
                comment: comment 
            });

        if (error) throw error;

        return new Response(JSON.stringify({ message: "Review posted successfully!" }), { status: 201 });

    } catch (error) {
        console.error("REVIEW POST ERROR:", error.message);
        return new Response(JSON.stringify({ error: "Failed to post review." }), { status: 500 });
    }
}