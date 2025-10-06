// app/api/genres/route.js

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// Mock genres data for when API key is not configured
const mockGenres = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'movie'; // 'movie' or 'tv'
    
    // Check if API key is configured
    if (!API_KEY || API_KEY === "demo_key") {
      console.log("No TMDB API key configured, using mock data");
      return new Response(JSON.stringify(mockGenres), { status: 200 });
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
    
    // Fallback to mock data on error
    console.log("Falling back to mock data due to error");
    return new Response(JSON.stringify(mockGenres), { status: 200 });
  }
}