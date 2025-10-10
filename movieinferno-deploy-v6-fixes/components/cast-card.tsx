import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { getImageUrl, type Cast } from "@/services/api"

interface CastCardProps {
  cast: Cast
  className?: string
}

export function CastCard({ cast, className = "" }: CastCardProps) {
  return (
    <Link href={`/person/${cast.id}`}>
      <Card
        className={`group cursor-pointer transition-all duration-300 hover:scale-105 bg-card border-border ${className}`}
      >
        <CardContent className="p-0">
          <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
            <Image
              src={getImageUrl(cast.profile_path) || "/placeholder.svg?height=300&width=200&query=person"}
              alt={cast.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            />
          </div>
          <div className="p-3">
            <h4 className="font-semibold text-card-foreground text-sm line-clamp-1 group-hover:text-accent transition-colors">
              {cast.name}
            </h4>
            <p className="text-muted-foreground text-xs line-clamp-2 mt-1">{cast.character}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
