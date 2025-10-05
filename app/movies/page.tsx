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

// You might need to create this MovieCard component
// components/movie-card.tsx
import { MovieCard } from "@/components/movie-card";

export default function MoviesPage() {
  const [session, setSession] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
      } else {
        setSession(data.session);
      }
    });
  }, [router]);

  useEffect(() => {
    if (session) {
      const fetchMovies = async () => {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
          .from("movies")
          .select("id, title, synopsis, poster, release_date") // Select specific columns
          .order('release_date', { ascending: false }) // Order by release date
          .limit(20); // Limit the number of movies for display

        if (fetchError) {
          console.error("Error fetching movies:", fetchError.message);
          setError("Failed to load movies. Please try again later.");
        } else {
          setMovies(data || []);
        }
        setLoading(false);
      };

      fetchMovies();
    }
  }, [session]);

  if (!session) {
    return <p className="text-white">Redirecting to login...</p>;
  }

  if (loading) {
    return <p className="text-white">Loading movies...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">{error}</p>;
  }

  // Assuming the first movie is the "hero" movie
  const heroMovie = movies.length > 0 ? movies[0] : null;
  const otherMovies = movies.length > 1 ? movies.slice(1) : [];

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />

      {/* Hero Section */}
      {heroMovie && (
        <div className="relative h-[60vh] md:h-[80vh] flex items-end justify-start p-8 md:p-16">
          <Image
            src={heroMovie.poster || "/placeholder.svg"} // Use your placeholder if no poster
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
              {heroMovie.synopsis}
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

      {/* Movies Grid */}
      <section className="py-8 px-4 md:px-16">
        <h2 className="text-3xl font-bold mb-6">Explore Movies</h2>
        {otherMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {otherMovies.map((movie) => (
              // MovieCard component will handle individual movie display
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <p>No more movies to display. Please sync more data.</p>
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