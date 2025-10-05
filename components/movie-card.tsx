// components/movie-card.tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getImageUrl } from "@/services/api"

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
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "TBA";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  return (
    <Link href={`/movie/${movie.id}`}>
      <Card
        className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/20 bg-card border-border ${className}`}
      >
        <CardContent className="p-0">
          <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
            <Image
              src={getImageUrl(movie.poster_path) || "/placeholder.svg"}
              alt={movie.title || "Movie poster"} // This is the corrected line
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/70 text-white border-none">
                <Star className="w-3 h-3 mr-1 fill-accent text-accent" />
                {rating}
              </Badge>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white text-sm line-clamp-3 text-balance">{movie.overview}</p>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-card-foreground line-clamp-2 text-balance mb-2 group-hover:text-accent transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              {releaseYear}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

