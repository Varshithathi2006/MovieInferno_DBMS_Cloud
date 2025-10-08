"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MovieCard } from "@/components/movie-card"
import { TVCard } from "@/components/tv-card"
import { PersonCard } from "@/components/person-card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { movieApi, tvApi, personApi, type Movie, type TVShow, type Person } from "@/services/api"
import { Search, Film, Tv, User, ExternalLink, Key } from "lucide-react"

type SearchCategory = "all" | "movies" | "tv" | "people"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [movies, setMovies] = useState<Movie[]>([])
  const [tvShows, setTVShows] = useState<TVShow[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false)
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all")

  useEffect(() => {
    const searchContent = async () => {
      if (!query.trim()) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [movieResults, tvResults, personResults] = await Promise.all([
          movieApi.search(query),
          tvApi.search(query),
          personApi.search(query),
        ])

        setMovies(movieResults.results)
        setTVShows(tvResults.results)
        setPeople(personResults.results)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"

        if (errorMessage.includes("API key not configured") || errorMessage.includes("Invalid TMDB API key")) {
          setIsApiKeyMissing(true)
          setError("TMDB API key is required to search content.")
        } else {
          setError("Failed to search content. Please try again later.")
        }
        console.error("Error searching content:", err)
      } finally {
        setLoading(false)
      }
    }

    searchContent()
  }, [query])

  const totalResults = movies.length + tvShows.length + people.length

  const categories = [
    { id: "all" as SearchCategory, name: "All", count: totalResults, icon: Search },
    { id: "movies" as SearchCategory, name: "Movies", count: movies.length, icon: Film },
    { id: "tv" as SearchCategory, name: "TV Shows", count: tvShows.length, icon: Tv },
    { id: "people" as SearchCategory, name: "People", count: people.length, icon: User },
  ]

  const filteredMovies = activeCategory === "all" || activeCategory === "movies" ? movies : []
  const filteredTVShows = activeCategory === "all" || activeCategory === "tv" ? tvShows : []
  const filteredPeople = activeCategory === "all" || activeCategory === "people" ? people : []

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
                  To search TMDB content, you need to configure your API key.
                </p>
                <Button asChild className="bg-orange-500 hover:bg-orange-600">
                  <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get TMDB API Key
                  </a>
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground mb-4">Search Error</h1>
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

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-accent/10 rounded-full">
                <Search className="h-12 w-12 text-accent" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Search Movie Inferno</h1>
            <p className="text-muted-foreground text-lg">Enter a search term to find movies, TV shows, and people</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Search Results for "{query}"</h1>
          <p className="text-muted-foreground">
            {totalResults > 0 ? `Found ${totalResults} results` : "No results found"}
          </p>
        </div>

        {totalResults > 0 && (
          <>
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    onClick={() => setActiveCategory(category.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                    <Badge variant="secondary" className="ml-1">
                      {category.count}
                    </Badge>
                  </Button>
                )
              })}
            </div>

            {/* Search Results */}
            <div className="space-y-12">
              {/* Movies Section */}
              {filteredMovies.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Film className="w-6 h-6" />
                    Movies ({movies.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredMovies.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                </section>
              )}

              {/* TV Shows Section */}
              {filteredTVShows.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Tv className="w-6 h-6" />
                    TV Shows ({tvShows.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredTVShows.map((show) => (
                      <TVCard key={show.id} show={show} />
                    ))}
                  </div>
                </section>
              )}

              {/* People Section */}
              {filteredPeople.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <User className="w-6 h-6" />
                    People ({people.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredPeople.map((person) => (
                      <PersonCard key={person.id} person={person} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}

        {totalResults === 0 && query.trim() && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-muted/50 rounded-full">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">No results found</h2>
            <p className="text-muted-foreground mb-8">Try adjusting your search terms or check for typos</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
