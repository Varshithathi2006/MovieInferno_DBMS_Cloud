import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.nextUrl);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching TV shows:', error);
    return NextResponse.json({ error: 'Failed to search TV shows' }, { status: 500 });
  }
}