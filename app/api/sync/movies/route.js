// app/api/sync/movies/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Helper function to fetch YouTube trailer
async function fetchYouTubeTrailer(movieTitle, releaseYear) {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured');
    return null;
  }

  try {
    const searchQuery = `${movieTitle} ${releaseYear} official trailer`;
    const response = await fetch(
      `${YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
    }
    return null;
  } catch (error) {
    console.error('Error fetching YouTube trailer:', error);
    return null;
  }
}

// Helper function to fetch TMDB videos (alternative to YouTube)
async function fetchTMDBTrailer(movieId) {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB Videos API error: ${response.status}`);
    }

    const data = await response.json();
    const trailer = data.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    );

    if (trailer) {
      return `https://www.youtube.com/watch?v=${trailer.key}`;
    }
    return null;
  } catch (error) {
    console.error('Error fetching TMDB trailer:', error);
    return null;
  }
}

// Helper function to sync genres
async function syncGenres() {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB Genres API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Upsert genres into database
    for (const genre of data.genres) {
      await supabase
        .from('genres')
        .upsert({
          id: genre.id,
          name: genre.name
        }, {
          onConflict: 'id'
        });
    }

    return data.genres.length;
  } catch (error) {
    console.error('Error syncing genres:', error);
    return 0;
  }
}

// Main sync function
async function syncMoviesFromTMDB(syncType = 'popular', page = 1) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured');
  }

  let endpoint;
  switch (syncType) {
    case 'popular':
      endpoint = `/movie/popular?page=${page}`;
      break;
    case 'trending':
      endpoint = `/trending/movie/week?page=${page}`;
      break;
    case 'top_rated':
      endpoint = `/movie/top_rated?page=${page}`;
      break;
    case 'now_playing':
      endpoint = `/movie/now_playing?page=${page}`;
      break;
    default:
      endpoint = `/movie/popular?page=${page}`;
  }

  try {
    // First sync genres
    await syncGenres();

    const response = await fetch(
      `${TMDB_BASE_URL}${endpoint}&api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    let syncedCount = 0;

    for (const movie of data.results) {
      try {
        // Get trailer URL (try TMDB first, then YouTube as fallback)
        let trailerUrl = await fetchTMDBTrailer(movie.id);
        if (!trailerUrl) {
          const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
          trailerUrl = await fetchYouTubeTrailer(movie.title, releaseYear);
        }

        // Upsert movie into database
        const { error: movieError } = await supabase
          .from('movies')
          .upsert({
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date || null,
            poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            synopsis: movie.overview,
            vote_average: movie.vote_average,
            vote_count: movie.vote_count,
            trailer_url: trailerUrl,
            backdrop_path: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null
          }, {
            onConflict: 'id'
          });

        if (movieError) {
          console.error('Error inserting movie:', movieError);
          continue;
        }

        // Insert movie-genre relationships
        if (movie.genre_ids && movie.genre_ids.length > 0) {
          for (const genreId of movie.genre_ids) {
            await supabase
              .from('movie_genres')
              .upsert({
                movie_id: movie.id,
                genre_id: genreId
              }, {
                onConflict: 'movie_id,genre_id'
              });
          }
        }

        syncedCount++;
      } catch (movieError) {
        console.error(`Error processing movie ${movie.title}:`, movieError);
      }
    }

    return {
      syncedCount,
      totalResults: data.total_results,
      totalPages: data.total_pages,
      currentPage: data.page
    };

  } catch (error) {
    console.error('Error syncing movies from TMDB:', error);
    throw error;
  }
}

// API route handler
export async function POST(request) {
  try {
    const { syncType = 'popular', pages = 1 } = await request.json();

    // Log sync start
    const { data: syncLog } = await supabase
      .from('movie_sync_log')
      .insert({
        sync_type: syncType,
        movies_synced: 0,
        success: false
      })
      .select()
      .single();

    let totalSynced = 0;
    let syncResults = [];

    // Sync multiple pages if requested
    for (let page = 1; page <= pages; page++) {
      try {
        const result = await syncMoviesFromTMDB(syncType, page);
        totalSynced += result.syncedCount;
        syncResults.push(result);
      } catch (pageError) {
        console.error(`Error syncing page ${page}:`, pageError);
      }
    }

    // Update sync log
    if (syncLog) {
      await supabase
        .from('movie_sync_log')
        .update({
          movies_synced: totalSynced,
          success: true,
          sync_completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${totalSynced} movies`,
      totalSynced,
      syncResults
    });

  } catch (error) {
    console.error('Sync API Error:', error);

    // Log sync failure
    await supabase
      .from('movie_sync_log')
      .insert({
        sync_type: 'error',
        movies_synced: 0,
        success: false,
        error_message: error.message,
        sync_completed_at: new Date().toISOString()
      });

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const { data: recentSyncs } = await supabase
      .from('movie_sync_log')
      .select('*')
      .order('sync_started_at', { ascending: false })
      .limit(10);

    const { data: movieCount } = await supabase
      .from('movies')
      .select('id', { count: 'exact' });

    const { data: genreCount } = await supabase
      .from('genres')
      .select('id', { count: 'exact' });

    return NextResponse.json({
      totalMovies: movieCount?.length || 0,
      totalGenres: genreCount?.length || 0,
      recentSyncs: recentSyncs || []
    });

  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}