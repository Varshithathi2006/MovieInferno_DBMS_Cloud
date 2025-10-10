import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Fetch reviews for a movie
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.nextUrl);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        user_id,
        movie_id,
        rating,
        comment,
        created_at,
        users (
          email,
          username
        )
      `)
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new review
export async function POST(request) {
  try {
    const { user_id, movie_id, rating, comment } = await request.json();

    // Validate required fields
    if (!user_id || !movie_id || !rating || !comment) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, movie_id, rating, comment' 
      }, { status: 400 });
    }

    // Validate rating range
    if (rating < 1 || rating > 10) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 10' 
      }, { status: 400 });
    }

    // Check if user already reviewed this movie
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user_id)
      .eq('movie_id', movie_id)
      .single();

    if (existingReview) {
      return NextResponse.json({ 
        error: 'You have already reviewed this movie',
        exists: true 
      }, { status: 409 });
    }

    // Insert new review
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id,
        movie_id,
        rating,
        comment,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding review:', error);
      return NextResponse.json({ error: 'Failed to add review' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Review posted successfully!',
      data 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an existing review
export async function PUT(request) {
  try {
    const { id, user_id, rating, comment } = await request.json();

    if (!id || !user_id || !rating || !comment) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, user_id, rating, comment' 
      }, { status: 400 });
    }

    // Validate rating range
    if (rating < 1 || rating > 10) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 10' 
      }, { status: 400 });
    }

    // Update review (only if it belongs to the user)
    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating,
        comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating review:', error);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Review not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Review updated successfully!',
      data 
    });
  } catch (error) {
    console.error('Error in PUT /api/reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a review
export async function DELETE(request) {
  try {
    const { id, user_id } = await request.json();

    if (!id || !user_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, user_id' 
      }, { status: 400 });
    }

    // Delete review (only if it belongs to the user)
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)
      .select();

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'Review not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Review deleted successfully',
      data: data[0] 
    });
  } catch (error) {
    console.error('Error in DELETE /api/reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}