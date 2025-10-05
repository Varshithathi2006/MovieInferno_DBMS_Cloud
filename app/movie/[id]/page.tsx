"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Star, Calendar, Clock, Play, Bookmark } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MovieSlider } from "@/components/movie-slider"
import { CastSlider } from "@/components/cast-slider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { movieApi, getImageUrl, type Movie, type Credits } from "@/services/api"

export default function MovieDetailsPage() {
  const params = useParams()
  const movieId = Number.parseInt(params.id as string)

  const [movie, setMovie] = useState<Movie | null>(null)
  const [credits, setCredits] = useState<Credits | null>(null)
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false)

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true)
        const [movieDetails, movieCredits, similar] = await Promise.all([
          movieApi.getDetails(movieId),
          movieApi.getCredits(movieId),
          movieApi.getSimilar(movieId),
        ])

        setMovie(movieDetails)
        setCredits(movieCredits)
        setSimilarMovies(similar.results)
        setIsApiKeyMissing(false)
      } catch (err) {
        console.error("Error fetching movie data:", err)
        if (err instanceof Error && err.message.includes("TMDB API key not configured")) {
          setIsApiKeyMissing(true)
          setError("TMDB API key not configured. Using demo data for preview.")
        } else {
          setError("Failed to load movie details. Please try again later.")
        }
      } finally {
        setLoading(false)
      }
    }

    if (movieId) {
      fetchMovieData()
    }
  }, [movieId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {isApiKeyMissing ? (
              <>
                <h1 className="text-2xl font-bold text-foreground mb-4">TMDB API Key Required</h1>
                <p className="text-muted-foreground mb-4">
                  To view real movie data, you need to configure your TMDB API key.
                </p>
                <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left max-w-2xl mx-auto">
                  <h3 className="font-semibold mb-3">Quick Setup:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Get a free API key from{" "}
                      <a
                        href="https://www.themoviedb.org/settings/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        TMDB
                      </a>
                    </li>
                    <li>Add it to your environment variables as NEXT_PUBLIC_TMDB_API_KEY</li>
                    <li>Refresh the page to see real movie data</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground mb-4">Movie not found</h1>
                <p className="text-muted-foreground mb-8">{error || "The movie you're looking for doesn't exist."}</p>
              </>
            )}
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "TBA"
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : "N/A"
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0">
          <Image
            src={getImageUrl(movie.backdrop_path, "original") || "/placeholder.svg"}
            alt={movie.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Button variant="ghost" asChild className="mb-8 text-white hover:bg-white/20">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Movie Poster */}
            <div className="flex-shrink-0">
              <div className="relative w-80 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={getImageUrl(movie.poster_path) || "/placeholder.svg"}
                  alt={movie.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Movie Info */}
            <div className="flex-1 text-white">
              <div className="mb-4">
                <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30 mb-4">
                  <Star className="w-3 h-3 mr-1 fill-accent" />
                  {rating}
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{movie.title}</h1>

              {movie.tagline && <p className="text-xl text-gray-300 mb-6 italic text-pretty">"{movie.tagline}"</p>}

              <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-300">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {releaseYear}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {runtime}
                </div>
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genres.map((genre) => (
                    <Badge key={genre.id} variant="outline" className="border-white/30 text-white">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-lg text-gray-200 mb-8 text-pretty leading-relaxed">{movie.overview}</p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Trailer
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                >
                  <Bookmark className="w-5 h-5 mr-2" />
                  Add to Watchlist
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          {/* Cast Section */}
          {credits && credits.cast.length > 0 && <CastSlider title="Cast" cast={credits.cast.slice(0, 20)} />}

          {/* Similar Movies Section */}
          {similarMovies.length > 0 && <MovieSlider title="Similar Movies" movies={similarMovies} />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
