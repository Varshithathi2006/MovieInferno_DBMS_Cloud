import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's favorite genre
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('favorite_genre_id')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (!user?.favorite_genre_id) {
      // If no favorite genre, return popular movies
      const { data: popularMovies, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .order('popularity', { ascending: false })
        .limit(20)

      if (moviesError) {
        console.error('Error fetching popular movies:', moviesError)
        return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 })
      }

      return NextResponse.json({ 
        movies: popularMovies || [],
        recommendationType: 'popular',
        message: 'Set your favorite genre in settings for personalized recommendations!'
      })
    }

    // Get movies from user's favorite genre
    const { data: genreMovies, error: genreError } = await supabase
      .from('movies')
      .select(`
        *,
        movie_genres!inner(genre_id)
      `)
      .eq('movie_genres.genre_id', user.favorite_genre_id)
      .order('vote_average', { ascending: false })
      .limit(20)

    if (genreError) {
      console.error('Error fetching genre movies:', genreError)
      return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
    }

    // Get genre name for display
    const { data: genre, error: genreNameError } = await supabase
      .from('genres')
      .select('name')
      .eq('id', user.favorite_genre_id)
      .single()

    const genreName = genre?.name || 'your favorite genre'

    return NextResponse.json({ 
      movies: genreMovies || [],
      recommendationType: 'personalized',
      genreName,
      message: `Recommended ${genreName} movies for you!`
    })

  } catch (error) {
    console.error('Error in recommendations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}