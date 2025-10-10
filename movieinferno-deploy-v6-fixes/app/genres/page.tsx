'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Film, Tv, Star, TrendingUp, Clock, Calendar } from 'lucide-react';
import { Navbar } from '@/components/navbar';

interface Genre {
  id: number;
  name: string;
}

const popularGenres = [
  { id: 28, name: "Action", icon: "⚡", color: "from-red-500 to-orange-500" },
  { id: 35, name: "Comedy", icon: "😄", color: "from-yellow-500 to-pink-500" },
  { id: 18, name: "Drama", icon: "🎭", color: "from-purple-500 to-blue-500" },
  { id: 27, name: "Horror", icon: "👻", color: "from-gray-700 to-red-600" },
  { id: 10749, name: "Romance", icon: "💕", color: "from-pink-500 to-red-500" },
  { id: 878, name: "Sci-Fi", icon: "🚀", color: "from-blue-500 to-cyan-500" },
  { id: 53, name: "Thriller", icon: "🔥", color: "from-orange-500 to-red-600" },
  { id: 16, name: "Animation", icon: "🎨", color: "from-green-500 to-blue-500" }
];

export default function GenresPage() {
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'popular' | 'movies' | 'tv'>('popular');

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        const [movieResponse, tvResponse] = await Promise.all([
          fetch('/api/genres?type=movie'),
          fetch('/api/genres?type=tv')
        ]);
        
        const movieData = await movieResponse.json();
        const tvData = await tvResponse.json();
        
        setMovieGenres(movieData);
        setTvGenres(tvData);
      } catch (err) {
        setError('Failed to fetch genres');
        console.error('Error fetching genres:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading genres...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-black-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
            Explore by Genre
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover movies and TV shows across all your favorite genres
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-6 py-3 rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'popular' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Star className="w-4 h-4" />
              Popular
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`px-6 py-3 rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'movies' 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Film className="w-4 h-4" />
              Movies
            </button>
            <button
              onClick={() => setActiveTab('tv')}
              className={`px-6 py-3 rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'tv' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Tv className="w-4 h-4" />
              TV Shows
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'popular' && (
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-center">Popular Genres</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {popularGenres.map((genre) => (
                <div key={genre.id} className="group">
                  <Link
                    href={`/genre/movie/${genre.id}`}
                    className={`block p-6 rounded-xl bg-gradient-to-br ${genre.color} hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{genre.icon}</div>
                      <h3 className="text-xl font-bold text-white mb-2">{genre.name}</h3>
                      <p className="text-white/80 text-sm">Explore {genre.name.toLowerCase()} content</p>
                    </div>
                  </Link>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/genre/movie/${genre.id}`}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-center text-sm transition-colors"
                    >
                      Movies
                    </Link>
                    <Link
                      href={`/genre/tv/${genre.id}`}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-center text-sm transition-colors"
                    >
                      TV Shows
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'movies' && (
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-center flex items-center justify-center gap-3">
              <Film className="w-8 h-8" />
              Movie Genres
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movieGenres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/genre/movie/${genre.id}`}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-center transition-all duration-300 hover:scale-105 hover:shadow-lg border border-gray-700 hover:border-blue-500"
                >
                  <div className="font-semibold">{genre.name}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tv' && (
          <div>
            <h2 className="text-3xl font-semibold mb-8 text-center flex items-center justify-center gap-3">
              <Tv className="w-8 h-8" />
              TV Show Genres
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tvGenres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/genre/tv/${genre.id}`}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-center transition-all duration-300 hover:scale-105 hover:shadow-lg border border-gray-700 hover:border-blue-500"
                >
                  <div className="font-semibold">{genre.name}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Access Section */}
        <div className="mt-16 bg-gray-800 rounded-xl p-8">
          <h3 className="text-2xl font-semibold mb-6 text-center">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/movies"
              className="bg-gray-700 hover:bg-gray-600 p-6 rounded-lg text-center transition-colors group"
            >
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-blue-400 group-hover:text-blue-300" />
              <h4 className="font-semibold mb-2">Popular Movies</h4>
              <p className="text-gray-400 text-sm">Browse trending and popular movies</p>
            </Link>
            <Link
              href="/tv"
              className="bg-gray-700 hover:bg-gray-600 p-6 rounded-lg text-center transition-colors group"
            >
              <Clock className="w-8 h-8 mx-auto mb-3 text-green-400 group-hover:text-green-300" />
              <h4 className="font-semibold mb-2">TV Shows</h4>
              <p className="text-gray-400 text-sm">Discover popular TV series</p>
            </Link>
            <Link
              href="/movies"
              className="bg-gray-700 hover:bg-gray-600 p-6 rounded-lg text-center transition-colors group"
            >
              <Calendar className="w-8 h-8 mx-auto mb-3 text-purple-400 group-hover:text-purple-300" />
              <h4 className="font-semibold mb-2">New Releases</h4>
              <p className="text-gray-400 text-sm">Check out the latest releases</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}