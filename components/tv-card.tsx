// components/tv-card.tsx
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Calendar, Bookmark, BookmarkCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getImageUrl } from "@/services/api"
import { supabase } from "@/lib/supabaseClient"

// --- FIX: Define the TVShow type here ---
interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string | null;
  vote_average: number | null;
  overview: string | null;
}
// --- END FIX ---

interface TVCardProps {
  show: TVShow;
  className?: string;
}

export function TVCard({ show, className = "" }: TVCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const releaseYear = show.first_air_date ? new Date(show.first_air_date).getFullYear() : "TBA"
  const rating = show.vote_average ? show.vote_average.toFixed(1) : "N/A"

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
  }, [show.id]);

  const checkWatchlistStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/watchlist?user_id=${userId}`);
      if (response.ok) {
        const watchlist = await response.json();
        const isInList = watchlist.some((item: any) => 
          item.tmdb_id === show.id && item.media_type === 'tv'
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
            tmdb_id: show.id,
            media_type: 'tv'
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
            tmdb_id: show.id,
            media_type: 'tv',
            title: show.name,
            poster_path: show.poster_path,
            release_date: show.first_air_date,
            vote_average: show.vote_average,
            overview: show.overview
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
    <Link href={`/tv/${show.id}`} className={`group block ${className}`}>
      <div className="relative overflow-hidden rounded-lg bg-black border border-red-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 hover:border-white">
        {/* Poster Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={imageError ? "/abstract-movie-poster.png" : getImageUrl(show.poster_path) || "/placeholder.svg"}
            alt={show.name || "TV show poster"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Rating Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-red-600 text-white border border-white">
              <Star className="w-3 h-3 mr-1 fill-white text-white" />
              {rating}
            </Badge>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="text-white">
              <p className="text-sm line-clamp-3 text-pretty">{show.overview}</p>
            </div>
          </div>
        </div>

        {/* Show Info */}
        <div className="p-4 bg-black">
          <h3 className="font-semibold text-white mb-2 line-clamp-2 text-balance group-hover:text-red-400 transition-colors">
            {show.name}
          </h3>
          <div className="flex items-center text-sm text-red-300 mb-3">
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
      </div>
    </Link>
  );
}

