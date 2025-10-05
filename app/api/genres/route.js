// app/api/genres/route.js

import { supabase } from "../../../lib/supabaseClient";

export async function GET() {
  try {
    const { data: genres, error } = await supabase.from('genres').select('*');
    if (error) throw error;
    
    return new Response(JSON.stringify(genres), { status: 200 });
  } catch (err) {
    console.error('API Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}