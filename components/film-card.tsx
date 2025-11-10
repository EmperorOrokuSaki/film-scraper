"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, User, ExternalLink, MapPin, Tag, ChevronDown, ChevronUp, Disc3Icon as Film3D } from "lucide-react"
import type { FilmScreening } from "@/lib/types"

interface FilmCardProps {
  screening: FilmScreening
}

export function FilmCard({ screening }: FilmCardProps) {
  const [showAllShowtimes, setShowAllShowtimes] = useState(false)

  // Current date and time for filtering past showtimes
  const now = new Date()

  // Filter out past showtimes
  const futureShowtimes = screening.showtimes?.filter((showtime) => {
    if (showtime.exactDateTime) {
      return new Date(showtime.exactDateTime) > now
    } else {
      const [hours, minutes] = showtime.time.split(":").map(Number)
      const showDateTime = new Date(screening.day || screening.date)
      showDateTime.setHours(hours, minutes)
      return showDateTime > now
    }
  })

  // Determine which showtimes to display based on the showAllShowtimes state
  const visibleShowtimes = showAllShowtimes ? futureShowtimes : futureShowtimes?.slice(0, 2)

  const hasMoreShowtimes = futureShowtimes && futureShowtimes.length > 2

  // Determine subtitle information
  const hasSubtitles =
    screening.description?.includes("OmU") ||
    screening.description?.includes("OmeU") ||
    screening.title?.includes("OmU") ||
    screening.title?.includes("OmeU")

  const hasGermanSubtitles = screening.description?.includes("OmU") || screening.title?.includes("OmU")
  const hasEnglishSubtitles = screening.description?.includes("OmeU") || screening.title?.includes("OmeU")

  // Check showtimes for subtitle information
  const hasOmUShowtimes = futureShowtimes?.some((s) => s.format?.includes("OmU"))
  const hasOVShowtimes = futureShowtimes?.some((s) => s.format?.includes("OV"))
  const hasDFShowtimes = futureShowtimes?.some((s) => s.format?.includes("DF"))

  let subtitleBadge = ""
  if (hasGermanSubtitles || hasOmUShowtimes) {
    subtitleBadge = "Original with German subtitles"
  } else if (hasEnglishSubtitles) {
    subtitleBadge = "Original with English subtitles"
  } else if (hasOVShowtimes) {
    subtitleBadge = "Original version"
  } else if (hasDFShowtimes) {
    subtitleBadge = "German dubbed"
  }

  // Format for badge styling
  const getFormatBadgeColor = (format: string) => {
    if (format.includes("OmU")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    if (format.includes("OV")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    if (format.includes("DF")) return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
    if (format.includes("IMAX")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    if (format.includes("iSense")) return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
    if (format.includes("3D")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    if (format.includes("Screen X")) return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }

  // Get source badge color
  const getSourceBadgeColor = (source: string) => {
    if (source === "babylon") return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
    if (source === "yorck") return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    if (source === "uci") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }

  // Get source display name
  const getSourceDisplayName = (source?: string) => {
    if (source === "babylon") return "Babylon Berlin"
    if (source === "yorck") return "Yorck Kino"
    if (source === "uci") return "UCI Kinowelt"
    return "Unknown"
  }

  // Get format icon
  const getFormatIcon = (format: string) => {
    if (format.includes("3D") || format.includes("IMAX") || format.includes("iSense")) {
      return <Film3D className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
    }
    return <Tag className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
  }

  return (
    <Card className="overflow-hidden flex flex-col h-full group hover:shadow-lg transition-all duration-300 border-muted/60">
      <div className="relative h-56 w-full overflow-hidden">
        {screening.imageUrl ? (
          <Image
            src={screening.imageUrl || "/placeholder.svg"}
            alt={screening.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Image
            src={`/abstract-geometric-shapes.png`}
            alt={screening.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {screening.source && (
          <Badge
            className="absolute top-3 right-3 z-10"
            style={{ backgroundColor: getSourceBadgeColor(screening.source).split(" ")[0] }}
          >
            {getSourceDisplayName(screening.source)}
          </Badge>
        )}
        {screening.year && (
          <Badge className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {screening.year}
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-bold text-lg line-clamp-2 group">
              {screening.url ? (
                <a
                  href={screening.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {screening.title}
                  <ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
              ) : (
                screening.title
              )}
            </h3>
          </div>
          {(screening.category || screening.genre) && (
            <Badge variant="outline" className="whitespace-nowrap">
              {screening.category || screening.genre}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Fixed height content area for consistent sizing - reduced height */}
      <div className="flex flex-col" style={{ minHeight: "120px" }}>
        <CardContent className="pb-2 flex-grow-0">
          {screening.director && (
            <div className="flex items-center gap-1 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Director:</span>
              <span>{screening.director}</span>
            </div>
          )}

          <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
            {screening.description || "No description available"}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col items-start pt-0 mt-auto">
          <div className="flex items-center gap-1 text-sm">
            {screening.runtime && (
              <>
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{screening.runtime}</span>
              </>
            )}
          </div>
        </CardFooter>
      </div>

      {/* Showtimes section in a separate container */}
      {futureShowtimes && futureShowtimes.length > 0 && (
        <div className="px-6 pb-6 w-full">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <Clock className="h-4 w-4 mr-1 text-primary" />
            Showtimes:
          </h4>
          <div className="flex flex-col gap-2 w-full">
            {visibleShowtimes?.map((showtime, index) => (
              <a
                key={index}
                href={showtime.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-2 border rounded-md hover:bg-accent transition-colors flex items-center gap-2 hover:border-primary/50 w-full"
              >
                <div className="flex items-center gap-1 font-medium min-w-[60px]">
                  <Clock className="h-3 w-3 flex-shrink-0 text-primary" />
                  <span className="whitespace-nowrap">{showtime.time}</span>
                </div>

                {showtime.format && (
                  <div className="flex items-center gap-1 mr-auto">
                    {getFormatIcon(showtime.format)}
                    <span
                      className={`px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${getFormatBadgeColor(showtime.format)}`}
                    >
                      {showtime.format}
                    </span>
                  </div>
                )}

                {showtime.cinema && (
                  <div className="flex items-center gap-1 ml-auto">
                    <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground truncate max-w-[150px]">{showtime.cinema}</span>
                  </div>
                )}
              </a>
            ))}

            {hasMoreShowtimes && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-xs font-medium text-primary hover:text-primary/80"
                onClick={() => setShowAllShowtimes(!showAllShowtimes)}
              >
                {showAllShowtimes ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show fewer showtimes
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {futureShowtimes.length - 2} more showtimes
                  </>
                )}
              </Button>
            )}
          </div>

          {screening.tags && screening.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {screening.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
