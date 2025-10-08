// app/api/movies/route.js

import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const { data: movies, error } = await supabase.from('movies').select('*');
    if (error) throw error;
    
    return new Response(JSON.stringify(movies), { status: 200 });
  } catch (err) {
    console.error('API Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}