import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Fetch user's watchlist
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching watchlist:', error);
      return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
    }

    return NextResponse.json(data);
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
    if (!user_id || !tmdb_id || !media_type || !title) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, tmdb_id, media_type, title' 
      }, { status: 400 });
    }

    // Check if item already exists in watchlist
    const { data: existingItem } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user_id)
      .eq('tmdb_id', tmdb_id)
      .eq('media_type', media_type)
      .single();

    if (existingItem) {
      return NextResponse.json({ 
        error: 'Item already in watchlist',
        exists: true 
      }, { status: 409 });
    }

    // Add item to watchlist
    const { data, error } = await supabase
      .from('watchlist')
      .insert([{
        user_id,
        tmdb_id,
        media_type,
        title,
        poster_path,
        release_date,
        vote_average: vote_average || 0,
        overview
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding to watchlist:', error);
      return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Added to watchlist successfully',
      data 
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

    // Delete by ID (preferred) or by user_id + tmdb_id + media_type
    let query = supabase.from('watchlist');
    
    if (id) {
      query = query.eq('id', id);
    } else if (user_id && tmdb_id && media_type) {
      query = query.eq('user_id', user_id).eq('tmdb_id', tmdb_id).eq('media_type', media_type);
    } else {
      return NextResponse.json({ 
        error: 'Either id or (user_id, tmdb_id, media_type) is required' 
      }, { status: 400 });
    }

    const { error } = await query.delete();

    if (error) {
      console.error('Error removing from watchlist:', error);
      return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Removed from watchlist successfully' 
    });
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

    const { data, error } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user_id)
      .eq('tmdb_id', tmdb_id)
      .eq('media_type', media_type)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking watchlist:', error);
      return NextResponse.json({ error: 'Failed to check watchlist' }, { status: 500 });
    }

    return NextResponse.json({ 
      inWatchlist: !!data,
      id: data?.id || null
    });
  } catch (error) {
    console.error('Error in PUT /api/watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}