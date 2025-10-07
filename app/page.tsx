"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroCarousel } from "@/components/hero-carousel"
import { MovieSlider } from "@/components/movie-slider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { movieApi, type Movie } from "@/services/api"
import { Button } from "@/components/ui/button"
import { ExternalLink, Key } from "lucide-react"

// ADDITION 1: Import the Chatbot Component
import { Chatbot } from "@/components/Chatbot" 
// ----------------------------------------

export default function HomePage() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])
  const [popularMovies, setPopularMovies] = useState<Movie[]>([])
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load trending movies first for hero carousel
        const trending = await movieApi.getTrending()
        setTrendingMovies(trending.results)
        setLoading(false) // Allow page to render with hero carousel
        
        // Load remaining sections progressively
        const [popular, topRated, upcoming] = await Promise.all([
          movieApi.getPopular(),
          movieApi.getTopRated(),
          movieApi.getUpcoming(),
        ])

        setPopularMovies(popular.results)
        setTopRatedMovies(topRated.results)
        setUpcomingMovies(upcoming.results)
        setSectionsLoading(false)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"

        if (errorMessage.includes("API key not configured") || errorMessage.includes("Invalid TMDB API key")) {
          setIsApiKeyMissing(true)
          setError("TMDB API key is required to fetch live movie data.")
        } else {
          setError("Failed to load movies. Please try again later.")
        }
        console.error("Error fetching movies:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6">
            {isApiKeyMissing ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-full">
                    <Key className="h-12 w-12 text-orange-500" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-4">API Key Required</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  To display live movie data from TMDB, you need to configure your API key. Don't worry - it's free and
                  takes just a few minutes!
                </p>
                <div className="bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto text-left">
                  <h3 className="font-semibold text-foreground mb-3">Quick Setup:</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Get a free API key from TMDB</li>
                    <li>
                      2. Add it to your environment variables as{" "}
                      <code className="bg-muted px-2 py-1 rounded text-orange-500">NEXT_PUBLIC_TMDB_API_KEY</code>
                    </li>
                    <li>3. Restart your development server</li>
                  </ol>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild className="bg-orange-500 hover:bg-orange-600">
                    <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Get TMDB API Key
                    </a>
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry Connection
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently showing sample data. Configure your API key to see live movie information.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">
                  Try Again
                </Button>
              </>
            )}
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 sm:px-6 lg:px-8">
        {/* Hero Carousel */}
        <div className="py-8">
          <HeroCarousel movies={trendingMovies.slice(0, 5)} />
        </div>

        {/* Movie Sections */}
        <div className="space-y-12 py-8">
          <MovieSlider title="Trending Now" movies={trendingMovies} />
          {sectionsLoading ? (
            <div className="space-y-12">
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
                <span className="ml-3 text-muted-foreground">Loading more movies...</span>
              </div>
            </div>
          ) : (
            <>
              <MovieSlider title="Popular Movies" movies={popularMovies} />
              <MovieSlider title="Top Rated" movies={topRatedMovies} />
              <MovieSlider title="Upcoming" movies={upcomingMovies} />
            </>
          )}
        </div>
        
        {/* ADDITION 2: Chatbot Integration */}
        <div className="py-12 max-w-lg mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6 text-center">Ask BingiBot (AI)</h2>
            <Chatbot /> 
        </div>
        {/* ----------------------------- */}

      </main>
      <Footer />
    </div>
  )
}