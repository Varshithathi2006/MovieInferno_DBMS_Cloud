import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Fetch user's watchlist
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.nextUrl);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch from the existing table structure
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_date', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
      return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
    }

    // Transform data and fetch TMDB details
    const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const API_BASE_URL = 'https://api.themoviedb.org/3';

    const enrichedData = await Promise.all(
      data.map(async (item) => {
        // The existing table structure has movie_id field
        // Positive values are movies, negative values are TV shows
        const isMovie = item.movie_id > 0;
        const tmdbId = Math.abs(item.movie_id);
        const mediaType = isMovie ? 'movie' : 'tv';

        // Fetch details from TMDB
        let tmdbDetails = null;
        try {
          const tmdbResponse = await fetch(
            `${API_BASE_URL}/${mediaType}/${tmdbId}?api_key=${API_KEY}`
          );
          if (tmdbResponse.ok) {
            tmdbDetails = await tmdbResponse.json();
          }
        } catch (tmdbError) {
          console.error('Error fetching TMDB details:', tmdbError);
        }

        return {
          id: item.id,
          user_id: item.user_id,
          tmdb_id: tmdbId,
          media_type: mediaType,
          title: tmdbDetails?.title || tmdbDetails?.name || (isMovie ? 'Movie' : 'TV Show'),
          poster_path: tmdbDetails?.poster_path || null,
          release_date: tmdbDetails?.release_date || tmdbDetails?.first_air_date || null,
          vote_average: tmdbDetails?.vote_average || 0,
          overview: tmdbDetails?.overview || null,
          created_at: item.added_date,
          watched: item.watched || false
        };
      })
    );

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error('Error in GET /api/watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add item to watchlist
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, tmdb_id, media_type, title, poster_path, release_date, vote_average, overview } = body;

    // Validate required fields
    if (!user_id || !tmdb_id || !media_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, tmdb_id, media_type' 
      }, { status: 400 });
    }

    // Convert tmdb_id based on media_type for the existing table structure
    // Positive values for movies, negative values for TV shows
    const movieId = media_type === 'movie' ? parseInt(tmdb_id) : -parseInt(tmdb_id);
    
    // Check if item already exists in watchlist
    const { data: existingItem } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user_id)
      .eq('movie_id', movieId)
      .single();

    if (existingItem) {
      return NextResponse.json({ 
        error: 'Item already in watchlist',
        exists: true 
      }, { status: 409 });
    }

    // Add item to watchlist using the existing table structure
    const insertData = {
      user_id,
      movie_id: movieId,
      added_date: new Date().toISOString(),
      watched: 0  // Use 0 instead of false for smallint compatibility
    };

    const { data, error } = await supabase
      .from('watchlist')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error adding to watchlist:', error);
      return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }

    // Return data in the expected format
    const responseData = {
      id: data.id,
      user_id: data.user_id,
      tmdb_id: parseInt(tmdb_id),
      media_type,
      title: title || (media_type === 'movie' ? 'Movie' : 'TV Show'),
      created_at: data.added_date
    };

    return NextResponse.json({ 
      message: 'Added to watchlist successfully',
      data: responseData 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove item from watchlist
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id, user_id, tmdb_id, media_type } = body;

    // Support deletion by ID (preferred) or by user_id + tmdb_id + media_type
    if (id) {
      // Delete by ID
      const { data, error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id) // Ensure user can only delete their own items
        .select();

      if (error) {
        console.error('Error removing from watchlist:', error);
        return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
      }

      if (data.length === 0) {
        return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
      }

      return NextResponse.json({ 
        message: 'Removed from watchlist successfully',
        data: data[0] 
      });
    } else if (user_id && tmdb_id && media_type) {
      // Delete by user_id + tmdb_id + media_type
      const movieId = media_type === 'movie' ? parseInt(tmdb_id) : -parseInt(tmdb_id);

      const { data, error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user_id)
        .eq('movie_id', movieId)
        .select();

      if (error) {
        console.error('Error removing from watchlist:', error);
        return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
      }

      if (data.length === 0) {
        return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
      }

      return NextResponse.json({ 
        message: 'Removed from watchlist successfully',
        data: data[0] 
      });
    } else {
      return NextResponse.json({ 
        error: 'Either id or (user_id, tmdb_id, media_type) is required' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in DELETE /api/watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Check if item is in watchlist
export async function PUT(request) {
  try {
    const body = await request.json();
    const { user_id, tmdb_id, media_type } = body;

    if (!user_id || !tmdb_id || !media_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, tmdb_id, media_type' 
      }, { status: 400 });
    }

    // Convert tmdb_id based on media_type for the existing table structure
    const movieId = media_type === 'movie' ? parseInt(tmdb_id) : -parseInt(tmdb_id);

    const { data, error } = await supabase
      .from('watchlist')
      .select('id, watched')
      .eq('user_id', user_id)
      .eq('movie_id', movieId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking watchlist status:', error);
      return NextResponse.json({ error: 'Failed to check watchlist status' }, { status: 500 });
    }

    return NextResponse.json({ 
      inWatchlist: !!data,
      watched: data?.watched || false,
      id: data?.id || null
    });
  } catch (error) {
    console.error('Error in PUT /api/watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}