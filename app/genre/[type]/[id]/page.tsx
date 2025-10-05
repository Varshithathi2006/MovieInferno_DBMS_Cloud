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
import { ArrowLeft } from "lucide-react"

// Corrected Movie type with all the properties your components expect
type Movie = {
    id: number;
    title: string;
    overview: string | null;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string | null;
    vote_average: number | null;
    vote_count: number | null;
};

// Corrected TVShow type with all the properties your components expect
type TVShow = {
    id: number;
    name: string;
    overview: string | null;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string | null;
    vote_average: number | null;
    vote_count: number | null;
};

export default function GenreDetailsPage() {
    const params = useParams();
    const genreId = params.id;
    const type = params.type as "movie" | "tv";
    const [content, setContent] = useState<Movie[] | TVShow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContentByGenre = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/genres');
                if (!response.ok) {
                    throw new Error("Failed to fetch content");
                }
                const data = await response.json();
                setContent(data);
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
    }, [genreId, type]);

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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
                    <p className="text-muted-foreground">{error}</p>
                </div>
                <Footer />
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {content.map((item) => (
                        type === 'movie' ? (
                            <MovieCard key={item.id} movie={item as Movie} />
                        ) : (
                            <TVCard key={item.id} show={item as TVShow} />
                        )
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}