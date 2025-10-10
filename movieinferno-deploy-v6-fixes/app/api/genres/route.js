// app/api/genres/route.js

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.nextUrl);
    const type = searchParams.get('type') || 'movie'; // 'movie' or 'tv'
    
    // Check if API key is configured
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: "TMDB API key not configured" }), 
        { status: 500 }
      );
    }

    // Fetch genres from TMDB
    const endpoint = type === 'tv' ? '/genre/tv/list' : '/genre/movie/list';
    const response = await fetch(`${API_BASE_URL}${endpoint}?api_key=${API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return new Response(JSON.stringify(data.genres), { status: 200 });
    
  } catch (err) {
    console.error('API Error:', err.message);
    return new Response(
      JSON.stringify({ error: "Failed to fetch genres from TMDB" }), 
      { status: 500 }
    );
  }
}