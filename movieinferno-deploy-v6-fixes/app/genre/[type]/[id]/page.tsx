"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MovieCard } from "@/components/movie-card"
import { TVCard } from "@/components/tv-card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Film, Tv } from "lucide-react"
import { genreApi, type Movie, type TVShow } from "@/services/api"

export default function GenreDetailsPage() {
    const params = useParams();
    const genreId = parseInt(params.id as string);
    const type = params.type as "movie" | "tv";
    const [content, setContent] = useState<Movie[] | TVShow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [genreName, setGenreName] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchContentByGenre = async () => {
            try {
                setLoading(true);
                setError(null);
                
                let response;
                if (type === "movie") {
                    response = await genreApi.getMoviesByGenre(genreId, currentPage);
                    setContent(response.results);
                } else {
                    response = await genreApi.getTVByGenre(genreId, currentPage);
                    setContent(response.results);
                }
                
                setTotalPages(response.total_pages);
                
                // Get genre name from the genre list
                const genresResponse = type === "movie" 
                    ? await genreApi.getMovieGenres()
                    : await genreApi.getTVGenres();
                
                const genre = genresResponse.genres.find(g => g.id === genreId);
                setGenreName(genre?.name || "Unknown Genre");
                
            } catch (err) {
                console.error(err);
                setError("Failed to fetch content");
            } finally {
                setLoading(false);
            }
        };

        if (genreId && type) {
            fetchContentByGenre();
        }
    }, [genreId, type, currentPage]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner size="lg" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center space-y-6">
                        <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
                        <p className="text-muted-foreground">{error}</p>
                        <Button asChild>
                            <Link href="/genres">Back to Genres</Link>
                        </Button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
    
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/genres">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Genres
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        {type === "movie" ? (
                            <Film className="w-6 h-6 text-accent" />
                        ) : (
                            <Tv className="w-6 h-6 text-accent" />
                        )}
                        <h1 className="text-3xl font-bold text-foreground">
                            {genreName} {type === "movie" ? "Movies" : "TV Shows"}
                        </h1>
                    </div>
                </div>

                {/* Content Grid */}
                {content.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-8">
                            {content.map((item) => (
                                type === 'movie' ? (
                                    <MovieCard key={item.id} movie={item as Movie} />
                                ) : (
                                    <TVCard key={item.id} show={item as TVShow} />
                                )
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const page = currentPage <= 3 
                                            ? i + 1 
                                            : currentPage + i - 2;
                                        
                                        if (page > totalPages) return null;
                                        
                                        return (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    })}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground text-lg">
                            No {type === "movie" ? "movies" : "TV shows"} found in this genre.
                        </p>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}