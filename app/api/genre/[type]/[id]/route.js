// app/api/genre/[type]/[id]/route.js

import { supabase } from "@/lib/supabaseClient";

export async function GET(request, { params }) {
  const genreId = params.id;
  const type = params.type;

  try {
    if (type === 'movie') {
      const { data: movieGenres, error } = await supabase
        .from('movie_genres')
        .select('*, movies(*)') 
        .eq('genre_id', genreId);

      if (error) throw error;
      
      const movies = movieGenres.map(item => item.movies);
      
      return new Response(JSON.stringify(movies), { status: 200 });

    } else if (type === 'tv') {
      return new Response(JSON.stringify({ message: "TV shows not yet implemented" }), { status: 200 });
    }
    
    throw new Error('Invalid content type.');
  } catch (err) {
    console.error('API Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}