"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Play, Info, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrailerModal } from "@/components/trailer-modal"
import { getImageUrl, type Movie } from "@/services/api"

interface HeroCarouselProps {
  movies: Movie[]
}

export function HeroCarousel({ movies }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-slide functionality with 3-second intervals
  useEffect(() => {
    if (movies.length <= 1 || isPaused || isTrailerModalOpen) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length)
    }, 3000) // Change slide every 3 seconds

    return () => clearInterval(interval)
  }, [movies.length, isPaused, isTrailerModalOpen])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length)
  }

  if (!movies.length) return null

  const currentMovie = movies[currentIndex]
  const releaseYear = currentMovie.release_date ? new Date(currentMovie.release_date).getFullYear() : "TBA"

  return (
    <section 
      className="relative h-[70vh] min-h-[500px] overflow-hidden rounded-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0">
        <Image
          src={getImageUrl(currentMovie.backdrop_path, "original") || "/placeholder.svg"}
          alt={currentMovie.title}
          fill
          className="object-cover transition-all duration-1000 ease-in-out"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl transition-all duration-700 ease-in-out transform"
               key={currentIndex}>
            <Badge variant="secondary" className="mb-4 bg-accent/20 text-accent border-accent/30">
              <Star className="w-3 h-3 mr-1 fill-accent" />
              {currentMovie.vote_average.toFixed(1)} • {releaseYear}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-balance">{currentMovie.title}</h1>
            <p className="text-lg text-gray-200 mb-8 line-clamp-3 text-pretty">{currentMovie.overview}</p>
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
                asChild
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <Link href={`/movie/${currentMovie.id}`}>
                  <Info className="w-5 h-5 mr-2" />
                  More Info
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={goToPrevious}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={goToNext}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {movies.slice(0, 5).map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-accent w-8" : "bg-white/50 hover:bg-white/70"
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        contentId={currentMovie.id}
        contentTitle={currentMovie.title}
        contentType="movie"
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
      />
    </section>
  )
}
