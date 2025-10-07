"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Calendar, Bookmark, BookmarkCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getImageUrl, type Movie } from "@/services/api"
import { supabase } from "@/lib/supabaseClient"
import { useWatchlist } from "@/hooks/use-watchlist"

interface MovieCardProps {
  movie: Movie;
  className?: string;
}

export function MovieCard({ movie, className = "" }: MovieCardProps) {
  const [user, setUser] = useState<any>(null);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isLoading } = useWatchlist(user?.id);
  
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "TBA";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    
    checkUser();
  }, []);

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please sign in to add items to your watchlist');
      return;
    }

    const inWatchlist = isInWatchlist(movie.id, 'movie');

    if (inWatchlist) {
      await removeFromWatchlist(movie.id, 'movie');
    } else {
      await addToWatchlist({
        tmdb_id: movie.id,
        media_type: 'movie',
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average || 0,
        overview: movie.overview
      });
    }
  };

  return (
    <Link href={`/movie/${movie.id}`}>
      <Card
        className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/20 bg-card border-border ${className}`}
      >
        <CardContent className="p-0">
          <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
            <Image
              src={getImageUrl(movie.poster_path) || "/placeholder.svg"}
              alt={movie.title || "Movie poster"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {/* ... Rating Badge and Overlay remain the same ... */}
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-card-foreground line-clamp-2 text-balance mb-2 group-hover:text-accent transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm mb-3">
              <Calendar className="w-4 h-4 mr-1" />
              {releaseYear}
            </div>

            {/* Watchlist Button */}
            <Button 
                onClick={handleWatchlistToggle}
                disabled={isLoading}
                variant={isInWatchlist(movie.id, 'movie') ? "secondary" : "default"}
                className={`w-full border border-white ${isInWatchlist(movie.id, 'movie') ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                size="sm"
            >
                {isLoading ? (
                  'Loading...'
                ) : isInWatchlist(movie.id, 'movie') ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    In Watchlist
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Add to Watchlist
                  </>
                )}
            </Button>

          </div>
        </CardContent>
      </Card>
    </Link>
  );
}