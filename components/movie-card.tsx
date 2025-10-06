"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Calendar, Bookmark, BookmarkCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getImageUrl } from "@/services/api"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

// NOTE: This interface should ideally be imported from a central types file.
interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
}

interface MovieCardProps {
  movie: Movie;
  className?: string;
}

export function MovieCard({ movie, className = "" }: MovieCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "TBA";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  // Check user authentication and watchlist status
  useEffect(() => {
    const checkUserAndWatchlist = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkWatchlistStatus(session.user.id);
      }
    };
    
    checkUserAndWatchlist();
  }, [movie.id]);

  const checkWatchlistStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/watchlist?user_id=${userId}`);
      if (response.ok) {
        const watchlist = await response.json();
        const isInList = watchlist.some((item: any) => 
          item.tmdb_id === movie.id && item.media_type === 'movie'
        );
        setIsInWatchlist(isInList);
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please sign in to add items to your watchlist');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        const response = await fetch('/api/watchlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: user.id,
            tmdb_id: movie.id,
            media_type: 'movie'
          }),
        });

        if (response.ok) {
          setIsInWatchlist(false);
        } else {
          throw new Error('Failed to remove from watchlist');
        }
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            tmdb_id: movie.id,
            media_type: 'movie',
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            overview: movie.overview
          }),
        });

        if (response.ok) {
          setIsInWatchlist(true);
        } else {
          throw new Error('Failed to add to watchlist');
        }
      }
    } catch (error) {
      console.error('Watchlist Error:', error);
      alert('❌ Could not update watchlist. Please try again.');
    } finally {
      setIsLoading(false);
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
                variant={isInWatchlist ? "secondary" : "default"}
                className={`w-full border border-white ${isInWatchlist ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                size="sm"
            >
                {isLoading ? (
                  'Loading...'
                ) : isInWatchlist ? (
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