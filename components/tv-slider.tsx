"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TVCard } from "@/components/tv-card"
import type { TVShow } from "@/services/api"

interface TVSliderProps {
  title: string
  shows: TVShow[]
  className?: string
}

export function TVSlider({ title, shows, className = "" }: TVSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320 // Width of TV card + gap
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount)
      scrollRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" })
    }
  }

  if (!shows.length) return null

  return (
    <section className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-red-400 text-balance">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll("left")}
            className="border-red-500 text-white hover:bg-red-600 hover:text-white bg-black hover:border-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll("right")}
            className="border-red-500 text-white hover:bg-red-600 hover:text-white bg-black hover:border-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {shows.map((show) => (
          <TVCard key={show.id} show={show} className="flex-none w-72" />
        ))}
      </div>
    </section>
  )
}
