// app/movies/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Assuming you have this
import { Navbar } from "@/components/navbar"; // Assuming you have this
import { Footer } from "@/components/footer"; // Assuming you have this
import { Play, Info } from "lucide-react"; // For Watch Trailer / More Info icons

// Import the MovieCard component and TMDB API
import { MovieCard } from "@/components/movie-card";
import { movieApi, getImageUrl, type Movie } from "@/services/api";

interface Genre {
  id: number;
  name: string;
}

export default function MoviesPage() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated' | 'now_playing' | 'upcoming'>('popular');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [popularResponse, topRatedResponse, nowPlayingResponse, upcomingResponse] = await Promise.all([
          movieApi.getPopular(),
          movieApi.getTopRated(),
          movieApi.getNowPlaying(),
          movieApi.getUpcoming()
        ]);

        // Fetch genres
        const genresResponse = await fetch('/api/genres?type=movie');
        const genresData = await genresResponse.json();
        
        setPopularMovies(popularResponse.results);
        setTopRatedMovies(topRatedResponse.results);
        setNowPlayingMovies(nowPlayingResponse.results);
        setUpcomingMovies(upcomingResponse.results);
        setGenres(genresData);
      } catch (fetchError) {
        console.error("Error fetching movies:", fetchError);
        setError("Failed to load movies. Please try again later.");
      }
      
      setLoading(false);
    };

    fetchMovies();
  }, [session]);

  useEffect(() => {
    const filterMoviesByGenre = () => {
      const currentMovies = getCurrentMovies();
      if (selectedGenre === null) {
        setFilteredMovies(currentMovies);
      } else {
        const filtered = currentMovies.filter(movie => 
          movie.genre_ids && movie.genre_ids.includes(selectedGenre)
        );
        setFilteredMovies(filtered);
      }
    };

    filterMoviesByGenre();
  }, [activeTab, selectedGenre, popularMovies, topRatedMovies, nowPlayingMovies, upcomingMovies]);

  const getCurrentMovies = () => {
    switch (activeTab) {
      case 'popular':
        return popularMovies;
      case 'top_rated':
        return topRatedMovies;
      case 'now_playing':
        return nowPlayingMovies;
      case 'upcoming':
        return upcomingMovies;
      default:
        return popularMovies;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'popular':
        return 'Popular Movies';
      case 'top_rated':
        return 'Top Rated Movies';
      case 'now_playing':
        return 'Now Playing Movies';
      case 'upcoming':
        return 'Upcoming Movies';
      default:
        return 'Popular Movies';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-white">Loading movies...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <p className="text-red-500 text-center mt-8">{error}</p>
        <Footer />
      </div>
    );
  }

  // Assuming the first movie is the "hero" movie
  const heroMovie = filteredMovies.length > 0 ? filteredMovies[0] : null;
  const otherMovies = filteredMovies.length > 1 ? filteredMovies.slice(1) : [];

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />

      {/* Hero Section */}
      {heroMovie && (
        <div className="relative h-[60vh] md:h-[80vh] flex items-end justify-start p-8 md:p-16">
          <Image
            src={getImageUrl(heroMovie.backdrop_path, "original") || "/placeholder.svg"}
            alt={heroMovie.title}
            fill
            className="object-cover object-center -z-10"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent -z-10" />
          <div className="relative z-10 max-w-2xl text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              {heroMovie.title}
            </h2>
            <p className="text-lg mb-6 line-clamp-3">
              {heroMovie.overview}
            </p>
            <div className="flex space-x-4">
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg">
                <Link href={`/movie/${heroMovie.id}`}>
                  <Play className="mr-2 h-5 w-5" /> Watch Trailer
                </Link>
              </Button>
              <Button asChild variant="secondary" className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 text-lg">
                <Link href={`/movie/${heroMovie.id}`}>
                  <Info className="mr-2 h-5 w-5" /> More Info
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sign-up encouragement for non-authenticated users */}
      {!user && (
        <section className="py-8 px-4 md:px-16">
          <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-lg p-6 mb-8 border border-red-500/30">
            <h3 className="text-xl font-bold text-white mb-2">🎬 Unlock the Full Experience!</h3>
            <p className="text-gray-300 mb-4">
              Sign up for free to access our complete movie database, create watchlists, write reviews, and get personalized recommendations!
            </p>
            <div className="flex space-x-4">
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link href="/signup">Sign Up Free</Link>
              </Button>
              <Button asChild variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Tab Navigation */}
      <section className="py-8 px-4 md:px-16">
        <div className="flex flex-wrap gap-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('popular')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'popular' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Popular
          </button>
          <button
            onClick={() => setActiveTab('top_rated')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'top_rated' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Top Rated
          </button>
          <button
            onClick={() => setActiveTab('now_playing')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'now_playing' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Now Playing
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'upcoming' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Upcoming
          </button>
        </div>

        {/* Genre Filter */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Filter by Genre</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedGenre === null
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Genres
            </button>
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedGenre === genre.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Movies Grid */}
      <section className="py-8 px-4 md:px-16">
        <h2 className="text-3xl font-bold mb-6">
          {getTabTitle()} {!user && "(Limited Preview)"}
        </h2>
        <p className="text-gray-400 mb-6">
          {filteredMovies.length} movies available
          {selectedGenre && (
            <span className="ml-2">
              • Filtered by {genres.find(g => g.id === selectedGenre)?.name}
            </span>
          )}
        </p>
        {otherMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {otherMovies.map((movie) => (
              // MovieCard component will handle individual movie display
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {selectedGenre 
                ? `No movies found in the ${genres.find(g => g.id === selectedGenre)?.name} genre.`
                : 'No movies found.'
              }
            </p>
            {selectedGenre && (
              <button
                onClick={() => setSelectedGenre(null)}
                className="mt-4 text-red-400 hover:text-red-300 underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
        {!user && otherMovies.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-400 mb-4">
              You're viewing a limited preview. Sign up to see our complete collection!
            </p>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/signup">View All Movies</Link>
            </Button>
          </div>
        )}
      </section>

      {/* You could add a "Popular Movies" slider here if you have it */}
      {/* <section className="py-8 px-4 md:px-16">
        <h2 className="text-3xl font-bold mb-6">Popular Movies</h2>
        <MovieSlider movies={someOtherPopularMovies} />
      </section> */}

      <Footer />
    </div>
  );
}