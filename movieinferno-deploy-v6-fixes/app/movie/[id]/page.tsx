"use client"

import { useState, useEffect, useCallback } from "react" 
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Star, Calendar, Clock, Play, Bookmark } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MovieSlider } from "@/components/movie-slider"
import { CastSlider } from "@/components/cast-slider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { TrailerModal } from "@/components/trailer-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { movieApi, getImageUrl, type Movie, type Credits } from "@/services/api"
import { ReviewForm } from '@/components/ReviewForm'; 

// NOTE: This type MUST include all properties used by MovieCard and this page.
type MovieData = {
    id: number;
    title: string | null;
    tagline: string | null;
    overview: string | null;
    runtime: number | null;
    release_date: string | null;
    vote_average: number | null;
    backdrop_path: string | null;
    poster_path: string | null;
    genres: { id: number; name: string }[];
};


export default function MovieDetailsPage() {
    const params = useParams()
    const movieId = Number.parseInt(params.id as string)

    const [movie, setMovie] = useState<MovieData | null>(null)
    const [credits, setCredits] = useState<Credits | null>(null)
    const [similarMovies, setSimilarMovies] = useState<MovieData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isApiKeyMissing, setIsApiKeyMissing] = useState(false)
    const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false)

    const fetchMovieData = useCallback(async () => {
        try {
            setLoading(true)
            
            // Fetch movie details from your API service
            const [movieDetails, movieCredits, similar] = await Promise.all([
                movieApi.getDetails(movieId),
                movieApi.getCredits(movieId),
                movieApi.getSimilar(movieId),
            ]) as unknown as [MovieData, Credits, { results: MovieData[] }]; // Type assertion to satisfy TypeScript

            setMovie(movieDetails)
            setCredits(movieCredits)
            setSimilarMovies(similar.results)
            setIsApiKeyMissing(false)
        } catch (err) {
            console.error("Error fetching movie data:", err)
            setError("Failed to load movie details. Check server logs for API error.");
        } finally {
            setLoading(false)
        }
    }, [movieId])

    useEffect(() => {
        if (movieId) {
            fetchMovieData()
        }
    }, [movieId, fetchMovieData])

    // Function passed to the ReviewForm to re-fetch data (refresh reviews/rating)
    const handleReviewSuccess = () => {
        // Re-fetch data to update the rating and display the new review list
        fetchMovieData() 
    }

    if (loading) {
        // ... (Loading Spinner JSX remains the same)
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
        // ... (Error/Not Found View JSX remains the same)
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">Movie not found</h1>
                    <p className="text-muted-foreground mb-8">{error || "The movie you're looking for doesn't exist."}</p>
                    <Button asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
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
                        alt={movie.title || "Movie Backdrop"}
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
                            <Image
                                src={getImageUrl(movie.poster_path) || "/placeholder.svg"}
                                alt={movie.title || "Movie Poster"}
                                width={300}
                                height={450}
                                className="rounded-lg shadow-2xl"
                                priority
                            />
                        </div>

                        {/* Movie Info */}
                        <div className="flex-1 text-white">
                            <h1 className="text-4xl md:text-5xl font-bold mb-2">{movie.title}</h1>
                            {movie.tagline && (
                                <p className="text-xl text-gray-300 italic mb-4">{movie.tagline}</p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
                                    <Star className="w-3 h-3 mr-1 fill-accent" />
                                    {rating}
                                </Badge>
                                <Badge variant="outline" className="border-white/30 text-white">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {releaseYear}
                                </Badge>
                                <Badge variant="outline" className="border-white/30 text-white">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {runtime}
                                </Badge>
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

                            {movie.overview && (
                                <p className="text-lg text-gray-200 mb-8 leading-relaxed">{movie.overview}</p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4">
                                <Button 
                                    size="lg" 
                                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                                    onClick={() => setIsTrailerModalOpen(true)}
                                >
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

            {/* Content Sections (Main) */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="space-y-16">
                    {/* Cast Section */}
                    {credits && credits.cast.length > 0 && <CastSlider title="Cast" cast={credits.cast.slice(0, 20)} />}

                    {/* --- REVIEW FORM SECTION --- */}
                    <section id="review-form-section">
                        <h2 className="text-3xl font-bold text-foreground mb-6">Write a Review</h2>
                        <ReviewForm 
                            // Ensure the movie object is not null before accessing its properties
                            movieId={movie.id} 
                            movieTitle={movie.title || "This Movie"} 
                            onReviewSuccess={handleReviewSuccess} 
                        />
                    </section>
                    {/* ---------------------------------- */}

                    {/* Similar Movies Section */}
                    {similarMovies.length > 0 && 
    <MovieSlider 
        title="Similar Movies" 
        movies={similarMovies as unknown as Movie[]} // <--- ADD THE TYPE ASSERTION HERE
    />
}
                </div>
            </main>

            <Footer />
            
            {/* Trailer Modal */}
            <TrailerModal
                contentId={movie?.id}
                contentTitle={movie?.title || ""}
                contentType="movie"
                isOpen={isTrailerModalOpen}
                onClose={() => setIsTrailerModalOpen(false)}
            />
        </div>
    )
};