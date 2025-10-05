// app/api/watchlist/route.js

import { supabase } from "../../../lib/supabaseClient";

// NOTE: Using a hardcoded ID for simplicity. In a real app, 
// this ID is retrieved securely from the user's session/JWT.
const TEST_USER_ID = '00a4d6a7-4f64-41b1-ba41-1e0acc587677'; 


// 1. ADD MOVIE TO WATCHLIST (POST)
export async function POST(request) {
    try {
        const { movie_id } = await request.json();

        // 1a. Check if movie is already present to prevent duplicates
        const { data: existing } = await supabase
            .from('watchlist')
            .select('id')
            .eq('user_id', TEST_USER_ID)
            .eq('movie_id', movie_id);

        if (existing && existing.length > 0) {
            return new Response(JSON.stringify({ message: "Movie already in watchlist" }), { status: 200 });
        }

        // 1b. Insert the new movie entry
        const { error } = await supabase
            .from('watchlist')
            .insert({ user_id: TEST_USER_ID, movie_id });

        if (error) throw error;

        return new Response(JSON.stringify({ message: "Movie added to watchlist" }), { status: 201 });

    } catch (error) {
        console.error("WATCHLIST POST ERROR:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

// 2. GET USER'S WATCHLIST (READ)
export async function GET() {
    try {
        // Fetch watchlist entries and perform a join (nested select) to get movie details
        const { data, error } = await supabase
            .from('watchlist')
            .select(`
                id,
                created_at,
                movies ( 
                    id, title, poster_path, vote_average
                )
            `)
            .eq('user_id', TEST_USER_ID)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Extract the movie objects from the watchlist join structure
        const watchlistMovies = data.map(item => item.movies);

        return new Response(JSON.stringify(watchlistMovies), { status: 200 });

    } catch (error) {
        console.error("WATCHLIST GET ERROR:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}