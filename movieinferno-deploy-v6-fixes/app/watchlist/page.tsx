'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, BookmarkX, Film, Tv, Calendar, Star, Trash2, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useWatchlist } from '@/hooks/use-watchlist';
import { Navbar } from '@/components/navbar';

interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
  overview: string | null;
  created_at: string;
}

export default function WatchlistPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [sortBy, setSortBy] = useState<'date_added' | 'title' | 'rating'>('date_added');
  
  const { watchlistItems, isInWatchlist, addToWatchlist, removeFromWatchlist, loading: watchlistLoading, error: watchlistError } = useWatchlist(user?.id);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
    };
    checkUser();
  }, [router]);

  const filteredItems = watchlistItems.filter(item => {
    if (filter === 'all') return true;
    return item.media_type === filter;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'rating':
        return b.vote_average - a.vote_average;
      case 'date_added':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (watchlistLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading your watchlist...</p>
        </div>
      </div>
    );
  }

  if (watchlistError) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-center border border-red-500 rounded-lg p-8 bg-gray-900 max-w-md mx-auto mt-20">
          <div className="text-red-400 text-xl mb-4">⚠️ {watchlistError}</div>
           <div className="text-gray-400">Please refresh the page to try again.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Bookmark className="w-12 h-12 text-red-400" />
            <h1 className="text-5xl font-bold text-red-400">
              My Watchlist
            </h1>
          </div>
          <p className="text-xl text-white max-w-2xl mx-auto">
            Keep track of movies and TV shows you want to watch
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors border ${
                filter === 'all' 
                  ? 'bg-red-600 text-white border-white' 
                  : 'bg-gray-900 text-white border-red-500 hover:bg-red-900 hover:border-white'
              }`}
            >
              All ({watchlistItems.length})
            </button>
            <button
              onClick={() => setFilter('movie')}
              className={`px-4 py-2 rounded-lg transition-colors border flex items-center gap-2 ${
                filter === 'movie' 
                  ? 'bg-red-600 text-white border-white' 
                  : 'bg-gray-900 text-white border-red-500 hover:bg-red-900 hover:border-white'
              }`}
            >
              <Film className="w-4 h-4" />
              Movies ({watchlistItems.filter(item => item.media_type === 'movie').length})
            </button>
            <button
              onClick={() => setFilter('tv')}
              className={`px-4 py-2 rounded-lg transition-colors border flex items-center gap-2 ${
                filter === 'tv' 
                  ? 'bg-red-600 text-white border-white' 
                  : 'bg-gray-900 text-white border-red-500 hover:bg-red-900 hover:border-white'
              }`}
            >
              <Tv className="w-4 h-4" />
              TV Shows ({watchlistItems.filter(item => item.media_type === 'tv').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-red-500 focus:border-white focus:outline-none"
            >
              <option value="date_added">Date Added</option>
              <option value="title">Title</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>

        {/* Watchlist Items */}
        {sortedItems.length === 0 ? (
          <div className="text-center py-16 border border-red-500 rounded-lg bg-gray-900 p-8">
            <Heart className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2 text-red-400">
              {filter === 'all' ? 'Your watchlist is empty' : `No ${filter === 'movie' ? 'movies' : 'TV shows'} in your watchlist`}
            </h3>
            <p className="text-white mb-6">
              Start adding movies and TV shows you want to watch!
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/movies"
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors flex items-center gap-2 border border-white hover:border-red-300"
              >
                <Film className="w-4 h-4" />
                Browse Movies
              </Link>
              <Link
                href="/tv"
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors flex items-center gap-2 border border-white hover:border-red-300"
              >
                <Tv className="w-4 h-4" />
                Browse TV Shows
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sortedItems.map((item) => (
              <div key={item.id} className="bg-gray-900 border border-red-500 rounded-lg overflow-hidden hover:bg-gray-800 hover:border-white transition-all duration-300 group shadow-lg hover:shadow-red-500/20">
                <div className="relative">
                  <Link href={`/${item.media_type}/${item.tmdb_id}`}>
                    <img
                      src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/placeholder.jpg'}
                      alt={item.title}
                      className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWatchlist(item.tmdb_id, item.media_type)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 border border-white"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute top-2 left-2 bg-black/80 border border-red-500 px-2 py-1 rounded-lg flex items-center gap-1">
                    {item.media_type === 'movie' ? (
                      <Film className="w-3 h-3 text-red-400" />
                    ) : (
                      <Tv className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-xs capitalize text-white">{item.media_type}</span>
                  </div>
                </div>
                
                <div className="p-4 bg-black">
                  <Link href={`/${item.media_type}/${item.tmdb_id}`}>
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 hover:text-red-400 transition-colors">
                      {item.title}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between text-sm text-white mb-2">
                    {item.release_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-red-400" />
                        <span>{new Date(item.release_date).getFullYear()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-red-400" />
                      <span>{item.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  {item.overview && (
                    <p className="text-xs text-gray-300 line-clamp-3">
                      {item.overview}
                    </p>
                  )}
                  
                  <div className="mt-3 text-xs text-red-300">
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}