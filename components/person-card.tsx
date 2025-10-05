"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { User } from "lucide-react"
import { getImageUrl, type Person } from "@/services/api"

interface PersonCardProps {
  person: Person
  className?: string
}

export function PersonCard({ person, className = "" }: PersonCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <Link href={`/person/${person.id}`} className={`group block ${className}`}>
      <div className="relative overflow-hidden rounded-lg bg-card border border-border transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-accent/50">
        {/* Profile Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {imageError || !person.profile_path ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <User className="w-16 h-16 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={getImageUrl(person.profile_path) || "/placeholder.svg"}
              alt={person.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Person Info */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2 text-balance group-hover:text-accent transition-colors">
            {person.name}
          </h3>
          <p className="text-sm text-muted-foreground capitalize">
            {person.known_for_department?.toLowerCase() || "Actor"}
          </p>
        </div>
      </div>
    </Link>
  )
}
