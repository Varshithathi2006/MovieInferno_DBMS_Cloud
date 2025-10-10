"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CastCard } from "@/components/cast-card"
import type { Cast } from "@/services/api"

interface CastSliderProps {
  title: string
  cast: Cast[]
  className?: string
}

export function CastSlider({ title, cast, className = "" }: CastSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200 // Width of cast card + gap
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount)
      scrollRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" })
    }
  }

  if (!cast.length) return null

  return (
    <section className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground text-balance">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll("left")}
            className="border-border hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll("right")}
            className="border-border hover:bg-accent hover:text-accent-foreground"
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
        {cast.map((person) => (
          <CastCard key={person.id} cast={person} className="flex-none w-48" />
        ))}
      </div>
    </section>
  )
}
