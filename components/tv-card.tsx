// components/tv-card.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getImageUrl } from "@/services/api"

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
  const releaseYear = show.first_air_date ? new Date(show.first_air_date).getFullYear() : "TBA"
  const rating = show.vote_average ? show.vote_average.toFixed(1) : "N/A"

  return (
    <Link href={`/tv/${show.id}`} className={`group block ${className}`}>
      <div className="relative overflow-hidden rounded-lg bg-card border border-border transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-accent/50">
        {/* Poster Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={imageError ? "/abstract-movie-poster.png" : getImageUrl(show.poster_path) || "/placeholder.svg"}
            alt={show.name || "TV show poster"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Rating Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-black/70 text-white border-none">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
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
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-2 line-clamp-2 text-balance group-hover:text-accent transition-colors">
            {show.name}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-1" />
            {releaseYear}
          </div>
        </div>
      </div>
    </Link>
  );
}

