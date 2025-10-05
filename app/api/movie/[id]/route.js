// app/api/movie/[id]/route.js

import { supabase } from "../../../../lib/supabaseClient";

export async function GET(request, { params }) {
  const movieId = params.id;

  try {
    // This query fetches a single movie that matches the ID from the URL
    const { data: movie, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single(); // Use .single() to get a single object instead of an array

    if (error) throw error;

    return new Response(JSON.stringify(movie), { status: 200 });
  } catch (err) {
    console.error('API Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}