"use client"

import { useState } from "react" // Added useState for local state/feedback
import Image from "next/image"
import Link from "next/link"
import { Star, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getImageUrl } from "@/services/api"
import { Button } from "@/components/ui/button" // Assuming Button is imported for the action

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
  const [isAdding, setIsAdding] = useState(false);
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "TBA";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  // --- NEW: Watchlist Logic ---
  const handleAddToWatchlist = async (e: React.MouseEvent) => {
    // Prevent the default link click action from navigating
    e.preventDefault(); 
    e.stopPropagation();

    setIsAdding(true);
    
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: movie.id }), // Sending the movie's unique ID
      });

      if (response.status === 201) {
        alert(`✅ "${movie.title}" added to Watchlist!`);
      } else if (response.status === 200) {
        alert(`ℹ "${movie.title}" is already on your Watchlist.`);
      } else {
        throw new Error("Server failed to process watchlist request.");
      }
    } catch (error) {
      console.error("Watchlist Error:", error);
      alert("❌ Could not add to watchlist. Please check server logs.");
    } finally {
      setIsAdding(false);
    }
  };
  // ---------------------------

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

            {/* NEW: Watchlist Button */}
            <Button 
                onClick={handleAddToWatchlist}
                disabled={isAdding}
                className="w-full bg-red-600 hover:bg-red-700"
                size="sm"
            >
                {isAdding ? 'Adding...' : '+ Add to Watchlist'}
            </Button>
            {/* --------------------------- */}

          </div>
        </CardContent>
      </Card>
    </Link>
  );
}