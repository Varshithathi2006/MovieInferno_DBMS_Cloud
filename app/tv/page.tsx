"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TVSlider } from "@/components/tv-slider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { tvApi, type TVShow } from "@/services/api"
import { Tv } from "lucide-react"

export default function TVShowsPage() {
  const [trendingShows, setTrendingShows] = useState<TVShow[]>([])
  const [popularShows, setPopularShows] = useState<TVShow[]>([])
  const [topRatedShows, setTopRatedShows] = useState<TVShow[]>([])
  const [airingTodayShows, setAiringTodayShows] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false)

  useEffect(() => {
    const fetchTVShows = async () => {
      try {
        setLoading(true)
        setError(null)
        const [trending, popular, topRated, airingToday] = await Promise.all([
          tvApi.getTrending(),
          tvApi.getPopular(),
          tvApi.getTopRated(),
          tvApi.getAiringToday(),
        ])

        setTrendingShows(trending.results)
        setPopularShows(popular.results)
        setTopRatedShows(topRated.results)
        setAiringTodayShows(airingToday.results)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"

        if (errorMessage.includes("API key not configured") || errorMessage.includes("Invalid TMDB API key")) {
          console.warn("API key missing, but mock data should be available")
          setError("Unable to load TV show data. Please check your configuration.")
        } else {
          setError("Failed to load TV shows. Please try again later.")
        }
        console.error("Error fetching TV shows:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTVShows()
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
            <>
              <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-accent/10 rounded-full">
              <Tv className="h-12 w-12 text-accent" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">TV Shows</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Discover the latest and greatest television series from around the world
          </p>
        </div>
      </div>

      {/* TV Show Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12 pb-16">
          <TVSlider title="Trending This Week" shows={trendingShows} />
          <TVSlider title="Popular TV Shows" shows={popularShows} />
          <TVSlider title="Top Rated" shows={topRatedShows} />
          <TVSlider title="Airing Today" shows={airingTodayShows} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
