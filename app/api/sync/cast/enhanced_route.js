// Enhanced Cast Sync API with Full TMDB Person Data
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper function to get detailed person information from TMDB
async function getPersonDetails(personId) {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {
      console.warn(`Failed to fetch person details for ID ${personId}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching person details for ID ${personId}:`, error);
    return null;
  }
}

// Enhanced function to upsert person with full TMDB data
async function upsertPersonWithDetails(castMember, fetchDetails = false) {
  try {
    let personData = {
      id: castMember.id,
      name: castMember.name,
      original_name: castMember.original_name || castMember.name,
      profile_path: castMember.profile_path ? `https://image.tmdb.org/t/p/w500${castMember.profile_path}` : null,
      known_for_department: castMember.known_for_department || 'Acting',
      gender: castMember.gender || null,
      popularity: castMember.popularity || 0,
      adult: castMember.adult || false
    };

    // Optionally fetch detailed person information
    if (fetchDetails) {
      const details = await getPersonDetails(castMember.id);
      if (details) {
        personData = {
          ...personData,
          biography: details.biography || null,
          birthday: details.birthday || null,
          deathday: details.deathday || null,
          place_of_birth: details.place_of_birth || null,
          imdb_id: details.imdb_id || null,
          homepage: details.homepage || null,
          also_known_as: details.also_known_as || null,
          popularity: details.popularity || personData.popularity
        };
      }
    }

    // Upsert person data
    const { error } = await supabase
      .from('people')
      .upsert(personData, {
        onConflict: 'id'
      });

    if (error) {
      console.error(`Error upserting person ${castMember.name}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error in upsertPersonWithDetails for ${castMember.name}:`, error);
    return false;
  }
}

// Enhanced function to sync cast for a single movie
async function syncMovieCastEnhanced(movieId, fetchPersonDetails = false) {
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

    // Sync cast members with enhanced data
    if (data.cast && data.cast.length > 0) {
      for (const castMember of data.cast.slice(0, 20)) {
        try {
          // Upsert person with enhanced data
          const personSuccess = await upsertPersonWithDetails(castMember, fetchPersonDetails);
          
          if (personSuccess) {
            // Insert cast relationship
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
                order_index: castMember.order,
                person_id: castMember.id
              }, {
                onConflict: 'id'
              });

            syncedCount++;
          }
        } catch (castError) {
          console.error(`Error syncing cast member ${castMember.name}:`, castError);
        }
      }
    }

    // Sync key crew members with enhanced data
    if (data.crew && data.crew.length > 0) {
      const keyJobs = ['Director', 'Producer', 'Executive Producer', 'Writer', 'Screenplay', 'Cinematography'];
      const keyCrew = data.crew.filter(crewMember => 
        keyJobs.includes(crewMember.job)
      ).slice(0, 10);

      for (const crewMember of keyCrew) {
        try {
          // Upsert person with enhanced data
          const personSuccess = await upsertPersonWithDetails(crewMember, fetchPersonDetails);
          
          if (personSuccess) {
            // Insert crew relationship
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
                order_index: null,
                person_id: crewMember.id
              }, {
                onConflict: 'id'
              });

            syncedCount++;
          }
        } catch (crewError) {
          console.error(`Error syncing crew member ${crewMember.name}:`, crewError);
        }
      }
    }

    return syncedCount;

  } catch (error) {
    console.error(`Error syncing enhanced cast for movie ${movieId}:`, error);
    throw error;
  }
}

// Enhanced function to sync cast for TV shows
async function syncTVCastEnhanced(tvShowId, fetchPersonDetails = false) {
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

    // Sync cast members with enhanced data
    if (data.cast && data.cast.length > 0) {
      for (const castMember of data.cast.slice(0, 15)) {
        try {
          // Upsert person with enhanced data
          const personSuccess = await upsertPersonWithDetails(castMember, fetchPersonDetails);
          
          if (personSuccess) {
            // Insert cast relationship
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
                order_index: castMember.order,
                person_id: castMember.id
              }, {
                onConflict: 'id'
              });

            syncedCount++;
          }
        } catch (castError) {
          console.error(`Error syncing TV cast member ${castMember.name}:`, castError);
        }
      }
    }

    return syncedCount;

  } catch (error) {
    console.error(`Error syncing enhanced cast for TV show ${tvShowId}:`, error);
    throw error;
  }
}

// API route handler with enhanced functionality
export async function POST(request) {
  try {
    const { 
      movieIds = [], 
      tvShowIds = [], 
      syncAll = false, 
      fetchPersonDetails = false,
      enhancedMode = true 
    } = await request.json();

    let totalSynced = 0;
    let results = {
      movies: [],
      tvShows: [],
      errors: [],
      enhancedMode: enhancedMode
    };

    // Sync movies
    if (movieIds.length > 0) {
      for (const movieId of movieIds) {
        try {
          const synced = enhancedMode 
            ? await syncMovieCastEnhanced(movieId, fetchPersonDetails)
            : await syncMovieCast(movieId); // fallback to original function
          
          results.movies.push({
            movieId,
            syncedCount: synced,
            status: 'success'
          });
          totalSynced += synced;
        } catch (error) {
          results.errors.push({
            type: 'movie',
            id: movieId,
            error: error.message
          });
        }
      }
    }

    // Sync TV shows
    if (tvShowIds.length > 0) {
      for (const tvShowId of tvShowIds) {
        try {
          const synced = enhancedMode 
            ? await syncTVCastEnhanced(tvShowId, fetchPersonDetails)
            : await syncTVCast(tvShowId); // fallback to original function
          
          results.tvShows.push({
            tvShowId,
            syncedCount: synced,
            status: 'success'
          });
          totalSynced += synced;
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
      totalSynced,
      results,
      message: `Successfully synced ${totalSynced} cast/crew members${enhancedMode ? ' with enhanced data' : ''}`
    });

  } catch (error) {
    console.error('Enhanced cast sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        message: 'Failed to sync cast data'
      },
      { status: 500 }
    );
  }
}