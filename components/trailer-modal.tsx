"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { movieApi, tvApi, type Video } from "@/services/api"

interface TrailerModalProps {
  contentId: number
  contentTitle: string
  contentType: 'movie' | 'tv'
  isOpen: boolean
  onClose: () => void
}

export function TrailerModal({ contentId, contentTitle, contentType, isOpen, onClose }: TrailerModalProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && contentId) {
      fetchVideos()
    }
  }, [isOpen, contentId, contentType])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = contentType === 'movie' 
        ? await movieApi.getVideos(contentId)
        : await tvApi.getVideos(contentId)
      
      // Filter for trailers and teasers from YouTube
      const trailers = response.results.filter(
        (video) => 
          video.site === "YouTube" && 
          (video.type === "Trailer" || video.type === "Teaser") &&
          video.official
      )
      
      setVideos(trailers)
    } catch (err) {
      console.error("Error fetching videos:", err)
      setError("Failed to load trailer")
    } finally {
      setLoading(false)
    }
  }

  const getYouTubeEmbedUrl = (key: string) => {
    return `https://www.youtube.com/embed/${key}?autoplay=1&rel=0&modestbranding=1`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-background rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{contentTitle} - Trailer</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && videos.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No trailers available</p>
            </div>
          )}

          {!loading && !error && videos.length > 0 && (
            <div className="space-y-4">
              {/* Main trailer */}
              <div className="aspect-video">
                <iframe
                  src={getYouTubeEmbedUrl(videos[0].key)}
                  title={videos[0].name}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>

              {/* Additional trailers */}
              {videos.length > 1 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    More Trailers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {videos.slice(1).map((video) => (
                      <button
                        key={video.id}
                        onClick={() => {
                          const iframe = document.querySelector('iframe') as HTMLIFrameElement
                          if (iframe) {
                            iframe.src = getYouTubeEmbedUrl(video.key)
                          }
                        }}
                        className="text-left p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <p className="text-sm font-medium truncate">{video.name}</p>
                        <p className="text-xs text-muted-foreground">{video.type}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}