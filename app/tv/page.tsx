'use client';

import { useState, useEffect } from 'react';
import { tvApi, TVShow } from '@/services/api';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';

interface Genre {
  id: number;
  name: string;
}

export default function TVPage() {
  const [popularShows, setPopularShows] = useState<TVShow[]>([]);
  const [topRatedShows, setTopRatedShows] = useState<TVShow[]>([]);
  const [onTheAirShows, setOnTheAirShows] = useState<TVShow[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated' | 'on_the_air'>('popular');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [filteredShows, setFilteredShows] = useState<TVShow[]>([]);

  useEffect(() => {
    const fetchTVShows = async () => {
      try {
        setLoading(true);
        setError(null);

        const [popularResponse, topRatedResponse, onTheAirResponse] = await Promise.all([
          tvApi.getPopular(),
          tvApi.getTopRated(),
          tvApi.getOnTheAir()
        ]);

        setPopularShows(popularResponse.results);
        setTopRatedShows(topRatedResponse.results);
        setOnTheAirShows(onTheAirResponse.results);

        // Extract unique genres from all shows
        const allShows = [
          ...popularResponse.results,
          ...topRatedResponse.results,
          ...onTheAirResponse.results
        ];
        
        const genreIds = new Set<number>();
        allShows.forEach(show => {
          show.genre_ids?.forEach(id => genreIds.add(id));
        });

        // Create genre objects (you might want to fetch actual genre names from TMDB)
        const genreList: Genre[] = Array.from(genreIds).map(id => ({
          id,
          name: getGenreName(id)
        }));

        setGenres(genreList);
      } catch (err) {
        setError('Failed to fetch TV shows. Please try again.');
        console.error('Error fetching TV shows:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTVShows();
  }, []);

  useEffect(() => {
    const filterShowsByGenre = () => {
      const currentShows = getCurrentShows();
      if (selectedGenre === null) {
        setFilteredShows(currentShows);
      } else {
        const filtered = currentShows.filter(show => 
          show.genre_ids && show.genre_ids.includes(selectedGenre)
        );
        setFilteredShows(filtered);
      }
    };

    filterShowsByGenre();
  }, [activeTab, selectedGenre, popularShows, topRatedShows, onTheAirShows]);

  const getCurrentShows = () => {
    switch (activeTab) {
      case 'popular':
        return popularShows;
      case 'top_rated':
        return topRatedShows;
      case 'on_the_air':
        return onTheAirShows;
      default:
        return popularShows;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'popular':
        return 'Popular TV Shows';
      case 'top_rated':
        return 'Top Rated TV Shows';
      case 'on_the_air':
        return 'Currently Airing TV Shows';
      default:
        return 'Popular TV Shows';
    }
  };

  const getGenreName = (id: number): string => {
    const genreMap: { [key: number]: string } = {
      10759: 'Action & Adventure',
      16: 'Animation',
      35: 'Comedy',
      80: 'Crime',
      99: 'Documentary',
      18: 'Drama',
      10751: 'Family',
      10762: 'Kids',
      9648: 'Mystery',
      10763: 'News',
      10764: 'Reality',
      10765: 'Sci-Fi & Fantasy',
      10766: 'Soap',
      10767: 'Talk',
      10768: 'War & Politics',
      37: 'Western'
    };
    return genreMap[id] || `Genre ${id}`;
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-black text-white p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p>Loading TV shows...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-black text-white p-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors border border-white"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">TV Shows</h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-gray-900 border border-red-500 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'popular' 
                  ? 'bg-red-600 text-white border border-white' 
                  : 'text-white hover:text-red-300 hover:bg-gray-800'
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => setActiveTab('top_rated')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'top_rated' 
                  ? 'bg-red-600 text-white border border-white' 
                  : 'text-white hover:text-red-300 hover:bg-gray-800'
              }`}
            >
              Top Rated
            </button>
            <button
              onClick={() => setActiveTab('on_the_air')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'on_the_air' 
                  ? 'bg-red-600 text-white border border-white' 
                  : 'text-white hover:text-red-300 hover:bg-gray-800'
              }`}
            >
              On The Air
            </button>
          </div>

          {/* Genre Filter */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-red-400">Filter by Genre</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-3 py-1 rounded-full text-sm transition-colors border ${
                  selectedGenre === null
                    ? 'bg-red-600 text-white border-white'
                    : 'bg-gray-900 text-white border-red-500 hover:bg-red-900 hover:border-white'
                }`}
              >
                All Genres
              </button>
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors border ${
                    selectedGenre === genre.id
                      ? 'bg-red-600 text-white border-white'
                      : 'bg-gray-900 text-white border-red-500 hover:bg-red-900 hover:border-white'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-red-400">{getTabTitle()}</h2>
            <p className="text-white mt-1">
              {filteredShows.length} shows available
              {selectedGenre && (
                <span className="ml-2 text-red-300">
                  • Filtered by {genres.find(g => g.id === selectedGenre)?.name}
                </span>
              )}
            </p>
          </div>
          
          {/* TV Shows Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredShows.map((show) => (
              <div key={show.id} className="bg-gray-900 border border-red-500 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 hover:scale-105 hover:border-white">
                <div className="relative aspect-[2/3]">
                  {show.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                      alt={show.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center border border-red-500">
                      <span className="text-red-400">No Image</span>
                    </div>
                  )}
                  {/* Rating Badge */}
                  <div className="absolute top-2 right-2 bg-red-600 border border-white text-white px-2 py-1 rounded-md text-sm font-semibold">
                    ⭐ {show.vote_average.toFixed(1)}
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-white hover:text-red-400 transition-colors">
                    {show.name}
                  </h3>
                  <p className="text-red-300 text-sm mb-3">
                    {show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs">
                      {show.vote_count} votes
                    </span>
                    <Link
                      href={`/tv/${show.id}`}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors border border-white hover:border-red-300"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredShows.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No TV shows found for the selected genre.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}