"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, User, Calendar, MapPin } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { personApi, getImageUrl, type Person } from "@/services/api"

interface PersonDetails extends Person {
  biography?: string
  birthday?: string
  deathday?: string | null
  place_of_birth?: string
  also_known_as?: string[]
  homepage?: string | null
}

export default function PersonDetailsPage() {
  const params = useParams()
  const personId = Number.parseInt(params.id as string)

  const [person, setPerson] = useState<PersonDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPersonData = async () => {
      try {
        setLoading(true)
        const personDetails = await personApi.getDetails(personId)
        setPerson(personDetails as PersonDetails)
      } catch (err) {
        setError("Failed to load person details. Please try again later.")
        console.error("Error fetching person data:", err)
      } finally {
        setLoading(false)
      }
    }

    if (personId) {
      fetchPersonData()
    }
  }, [personId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Person not found</h1>
            <p className="text-muted-foreground mb-8">{error || "The person you're looking for doesn't exist."}</p>
            <Button asChild>
              <Link href="/search">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const birthYear = person.birthday ? new Date(person.birthday).getFullYear() : null
  const deathYear = person.deathday ? new Date(person.deathday).getFullYear() : null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/search">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Image */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg bg-muted">
                {person.profile_path ? (
                  <Image
                    src={getImageUrl(person.profile_path, "h632") || "/placeholder.svg"}
                    alt={person.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Known For</h3>
                  <Badge variant="outline" className="capitalize">
                    {person.known_for_department?.toLowerCase() || "Acting"}
                  </Badge>
                </div>

                {person.birthday && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Born</h3>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(person.birthday).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {birthYear && ` (${new Date().getFullYear() - birthYear} years old)`}
                    </div>
                  </div>
                )}

                {person.deathday && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Died</h3>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(person.deathday).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {deathYear && birthYear && ` (${deathYear - birthYear} years old)`}
                    </div>
                  </div>
                )}

                {person.place_of_birth && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Place of Birth</h3>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      {person.place_of_birth}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">{person.name}</h1>

                {person.also_known_as && person.also_known_as.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-foreground mb-2">Also Known As</h3>
                    <div className="flex flex-wrap gap-2">
                      {person.also_known_as.slice(0, 5).map((alias, index) => (
                        <Badge key={index} variant="secondary">
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Biography */}
              {person.biography && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Biography</h2>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    {person.biography.split("\n\n").map((paragraph, index) => (
                      <p key={index} className="text-muted-foreground leading-relaxed mb-4 text-pretty">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {!person.biography && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No biography available for {person.name}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
