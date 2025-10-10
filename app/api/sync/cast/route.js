// app/api/sync/cast/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper function to sync cast for a single movie
async function syncMovieCast(movieId) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB Credits API error: ${response.status}`);
    }

    const data = await response.json();
    let syncedCount = 0;

    // Sync cast members
    if (data.cast && data.cast.length > 0) {
      for (const castMember of data.cast.slice(0, 20)) { // Limit to top 20 cast members
        try {
          // First, upsert the person details
          await supabase
            .from('people')
            .upsert({
              id: castMember.id,
              name: castMember.name,
              photo: castMember.profile_path ? `https://image.tmdb.org/t/p/w500${castMember.profile_path}` : null,
              known_for_department: castMember.known_for_department || 'Acting'
            }, {
              onConflict: 'id'
            });

          // Then, insert the cast relationship
          await supabase
            .from('peoples')
            .upsert({
              id: `${movieId}_${castMember.id}_cast`,
              name: castMember.name,
              role: castMember.character,
              profile_path: castMember.profile_path ? `https://image.tmdb.org/t/p/w500${castMember.profile_path}` : null,
              movie_id: movieId,
              tv_show_id: null,
              department: 'Acting',
              job: 'Actor',
              character_name: castMember.character,
              order_index: castMember.order
            }, {
              onConflict: 'id'
            });

          syncedCount++;
        } catch (castError) {
          console.error(`Error syncing cast member ${castMember.name}:`, castError);
        }
      }
    }

    // Sync key crew members (director, producer, writer)
    if (data.crew && data.crew.length > 0) {
      const keyJobs = ['Director', 'Producer', 'Executive Producer', 'Writer', 'Screenplay', 'Cinematography'];
      const keyCrew = data.crew.filter(crewMember => 
        keyJobs.includes(crewMember.job)
      ).slice(0, 10); // Limit to top 10 crew members

      for (const crewMember of keyCrew) {
        try {
          // First, upsert the person details
          await supabase
            .from('people')
            .upsert({
              id: crewMember.id,
              name: crewMember.name,
              photo: crewMember.profile_path ? `https://image.tmdb.org/t/p/w500${crewMember.profile_path}` : null,
              known_for_department: crewMember.known_for_department || crewMember.department
            }, {
              onConflict: 'id'
            });

          // Then, insert the crew relationship
          await supabase
            .from('peoples')
            .upsert({
              id: `${movieId}_${crewMember.id}_${crewMember.job.toLowerCase().replace(/\s+/g, '_')}`,
              name: crewMember.name,
              role: crewMember.job,
              profile_path: crewMember.profile_path ? `https://image.tmdb.org/t/p/w500${crewMember.profile_path}` : null,
              movie_id: movieId,
              tv_show_id: null,
              department: crewMember.department,
              job: crewMember.job,
              character_name: null,
              order_index: null
            }, {
              onConflict: 'id'
            });

          syncedCount++;
        } catch (crewError) {
          console.error(`Error syncing crew member ${crewMember.name}:`, crewError);
        }
      }
    }

    return syncedCount;

  } catch (error) {
    console.error(`Error syncing cast for movie ${movieId}:`, error);
    throw error;
  }
}

// Helper function to sync cast for TV shows
async function syncTVCast(tvShowId) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tvShowId}/credits?api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB TV Credits API error: ${response.status}`);
    }

    const data = await response.json();
    let syncedCount = 0;

    // Sync cast members
    if (data.cast && data.cast.length > 0) {
      for (const castMember of data.cast.slice(0, 15)) { // Limit to top 15 cast members
        try {
          // First, upsert the person details
          await supabase
            .from('people')
            .upsert({
              id: castMember.id,
              name: castMember.name,
              photo: castMember.profile_path ? `https://image.tmdb.org/t/p/w500${castMember.profile_path}` : null,
              known_for_department: castMember.known_for_department || 'Acting'
            }, {
              onConflict: 'id'
            });

          // Then, insert the cast relationship
          await supabase
            .from('peoples')
            .upsert({
              id: `tv_${tvShowId}_${castMember.id}_cast`,
              name: castMember.name,
              role: castMember.character,
              profile_path: castMember.profile_path ? `https://image.tmdb.org/t/p/w500${castMember.profile_path}` : null,
              movie_id: null,
              tv_show_id: tvShowId,
              department: 'Acting',
              job: 'Actor',
              character_name: castMember.character,
              order_index: castMember.order
            }, {
              onConflict: 'id'
            });

          syncedCount++;
        } catch (castError) {
          console.error(`Error syncing TV cast member ${castMember.name}:`, castError);
        }
      }
    }

    return syncedCount;

  } catch (error) {
    console.error(`Error syncing cast for TV show ${tvShowId}:`, error);
    throw error;
  }
}

// API route handler
export async function POST(request) {
  try {
    const { movieIds = [], tvShowIds = [], syncAll = false } = await request.json();

    let totalSynced = 0;
    let results = {
      movies: [],
      tvShows: [],
      errors: []
    };

    // If syncAll is true, get all movies and TV shows from database
    if (syncAll) {
      try {
        // Get all movies
        const { data: movies } = await supabase
          .from('movies')
          .select('id')
          .limit(100); // Limit to prevent overwhelming the API

        if (movies) {
          for (const movie of movies) {
            try {
              const syncedCount = await syncMovieCast(movie.id);
              totalSynced += syncedCount;
              results.movies.push({
                movieId: movie.id,
                syncedCount
              });
            } catch (error) {
              results.errors.push({
                type: 'movie',
                id: movie.id,
                error: error.message
              });
            }
          }
        }

        // Get all TV shows
        const { data: tvShows } = await supabase
          .from('tv_shows')
          .select('id')
          .limit(50); // Limit to prevent overwhelming the API

        if (tvShows) {
          for (const tvShow of tvShows) {
            try {
              const syncedCount = await syncTVCast(tvShow.id);
              totalSynced += syncedCount;
              results.tvShows.push({
                tvShowId: tvShow.id,
                syncedCount
              });
            } catch (error) {
              results.errors.push({
                type: 'tv',
                id: tvShow.id,
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in syncAll operation:', error);
        return NextResponse.json(
          { error: 'Failed to sync all cast data' },
          { status: 500 }
        );
      }
    } else {
      // Sync specific movies
      for (const movieId of movieIds) {
        try {
          const syncedCount = await syncMovieCast(movieId);
          totalSynced += syncedCount;
          results.movies.push({
            movieId,
            syncedCount
          });
        } catch (error) {
          results.errors.push({
            type: 'movie',
            id: movieId,
            error: error.message
          });
        }
      }

      // Sync specific TV shows
      for (const tvShowId of tvShowIds) {
        try {
          const syncedCount = await syncTVCast(tvShowId);
          totalSynced += syncedCount;
          results.tvShows.push({
            tvShowId,
            syncedCount
          });
        } catch (error) {
          results.errors.push({
            type: 'tv',
            id: tvShowId,
            error: error.message
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced cast data for ${totalSynced} people`,
      totalSynced,
      results
    });

  } catch (error) {
    console.error('Cast sync API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve cast for a specific movie or TV show
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');
    const tvShowId = searchParams.get('tvShowId');

    if (!movieId && !tvShowId) {
      return NextResponse.json(
        { error: 'Either movieId or tvShowId is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('peoples')
      .select('*')
      .order('order_index', { ascending: true, nullsLast: true });

    if (movieId) {
      query = query.eq('movie_id', movieId);
    } else {
      query = query.eq('tv_show_id', tvShowId);
    }

    const { data: cast, error } = await query;

    if (error) {
      throw error;
    }

    // Separate cast and crew
    const castMembers = cast.filter(person => person.department === 'Acting');
    const crewMembers = cast.filter(person => person.department !== 'Acting');

    return NextResponse.json({
      cast: castMembers,
      crew: crewMembers,
      total: cast.length
    });

  } catch (error) {
    console.error('Get cast error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}