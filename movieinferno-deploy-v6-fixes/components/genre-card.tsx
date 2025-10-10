"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface Genre {
  id: number
  name: string
}

interface GenreCardProps {
  genre: Genre
  type: "movie" | "tv"
  className?: string
}

export function GenreCard({ genre, type, className = "" }: GenreCardProps) {
  return (
    <Link href={`/genre/${type}/${genre.id}`} className={`group block ${className}`}>
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 border border-border transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-accent/50 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
            {genre.name}
          </h3>
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
        </div>
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">
            Explore {type === "movie" ? "movies" : "TV shows"} in this genre
          </p>
        </div>
      </div>
    </Link>
  )
}
