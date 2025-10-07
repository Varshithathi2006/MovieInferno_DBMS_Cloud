import { readFileSync } from 'fs';

// Read environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf8');
const envLines = envContent.split('\n');
const envVars = {};

envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

const API_KEY = envVars.NEXT_PUBLIC_TMDB_API_KEY;
const API_BASE_URL = "https://api.themoviedb.org/3";

console.log('🔑 Testing TMDB API Key...');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT FOUND');

async function testTMDBAPI() {
  try {
    const url = `${API_BASE_URL}/movie/popular?api_key=${API_KEY}`;
    console.log('📡 Making API request to TMDB...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API request successful!');
    console.log('📊 Results:', data.results.length, 'movies found');
    console.log('🎬 First movie:', data.results[0]?.title);
    console.log('🎬 Second movie:', data.results[1]?.title);
    console.log('🎬 Third movie:', data.results[2]?.title);
    
  } catch (error) {
    console.error('❌ Error testing TMDB API:', error.message);
  }
}

testTMDBAPI();