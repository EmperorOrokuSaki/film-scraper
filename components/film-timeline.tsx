"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useSearchParams } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { getFilmScreenings } from "@/lib/scraper"
import { FilmCard } from "./film-card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { scrapeFilmScreenings, getLatestFetchedDay } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Film, Loader2 } from "lucide-react"
import type { FilmScreening, DayGroup } from "@/lib/types"

export function FilmTimeline() {
  const [screenings, setScreenings] = useState<FilmScreening[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hideDuplicates, setHideDuplicates] = useState(false)
  const [activeSource, setActiveSource] = useState<"all" | "babylon" | "yorck" | "uci">("all")
  const [visibleDays, setVisibleDays] = useState<number>(3)
  const [hasMoreDays, setHasMoreDays] = useState<boolean>(false)
  const [additionalDays, setAdditionalDays] = useState<number>(3)
  const [latestFetchedDay, setLatestFetchedDay] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("search")?.toLowerCase() || ""
  const router = useRouter()
  const { toast } = useToast()
  const dataLoadedRef = useRef(false)
  const now = new Date() // Current date and time for filtering past screenings

  // Function to load screenings
  const loadScreenings = useCallback(async () => {
    // Remove the early return to ensure data is always loaded
    // if (dataLoadedRef.current) return

    setLoading(true)
    try {
      const data = await getFilmScreenings()
      setScreenings(data)
      dataLoadedRef.current = true

      // Get the latest fetched day
      const latestDay = await getLatestFetchedDay()
      setLatestFetchedDay(latestDay)

      // Check if there are more days available
      const uniqueDays = new Set(data.map((screening) => screening.day))
      setHasMoreDays(uniqueDays.size > visibleDays)
    } catch (error) {
      console.error("Error loading screenings:", error)
      // Silent error handling for user
    } finally {
      setLoading(false)
    }
  }, [visibleDays])

  // Load screenings on initial render
  useEffect(() => {
    loadScreenings()
  }, [loadScreenings])

  // Function to load more days
  const loadMoreDays = async () => {
    if (!latestFetchedDay) return

    setLoadingMore(true)
    try {
      // Calculate the next day after the latest fetched day
      const nextDay = new Date(latestFetchedDay)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayStr = nextDay.toISOString().split("T")[0]

      // Scrape screenings for additional days starting from the next day
      await scrapeFilmScreenings(nextDayStr, additionalDays)

      // Refresh the data
      const data = await getFilmScreenings()
      setScreenings(data)

      // Update the latest fetched day
      const newLatestDay = await getLatestFetchedDay()
      setLatestFetchedDay(newLatestDay)

      // Increase visible days
      setVisibleDays((prev) => prev + additionalDays)

      toast({
        title: "Success!",
        description: `Loaded screenings for ${additionalDays} more days.`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more screenings.",
        variant: "destructive",
      })
    } finally {
      setLoadingMore(false)
    }
  }

  // Filter screenings based on search query, active source, and current time
  const filteredScreenings = screenings.filter((screening) => {
    // Exclude UCI screenings
    if (screening.source === "uci") {
      return false
    }

    // Filter by search query
    const matchesSearch =
      !searchQuery ||
      screening.title.toLowerCase().includes(searchQuery) ||
      screening.description?.toLowerCase().includes(searchQuery) ||
      screening.director?.toLowerCase().includes(searchQuery) ||
      (screening.category || screening.genre)?.toLowerCase().includes(searchQuery) ||
      screening.year?.toLowerCase().includes(searchQuery)

    // Filter by source
    const matchesSource = activeSource === "all" || screening.source === activeSource

    // Filter out past screenings
    let isFutureScreening = true

    if (screening.showtimes && screening.showtimes.length > 0) {
      // Check if any showtime is in the future
      isFutureScreening = screening.showtimes.some((showtime) => {
        if (showtime.exactDateTime) {
          // If we have exact date and time, use it
          return new Date(showtime.exactDateTime) > now
        } else {
          // Otherwise, construct date and time from day and time
          const [hours, minutes] = showtime.time.split(":").map(Number)
          const showDateTime = new Date(screening.day || screening.date)
          showDateTime.setHours(hours, minutes)
          return showDateTime > now
        }
      })
    } else {
      // If no showtimes, use the screening date
      const screeningDate = new Date(screening.date)
      isFutureScreening = screeningDate > now
    }

    return matchesSearch && matchesSource && isFutureScreening
  })

  // Remove duplicates if the toggle is on
  const processedScreenings = hideDuplicates
    ? filteredScreenings.filter((screening, index, self) => {
        // Find the first occurrence of this film title
        const firstIndex = self.findIndex((s) => s.title === screening.title)
        // Keep this screening if it's the first occurrence
        return index === firstIndex
      })
    : filteredScreenings

  // Group screenings by day
  const screeningsByDay = processedScreenings.reduce<DayGroup[]>((acc, screening) => {
    if (!screening.day) return acc

    // Find existing day group or create new one
    const dayGroup = acc.find((group) => group.date === screening.day)

    if (dayGroup) {
      dayGroup.screenings.push(screening)
    } else {
      acc.push({
        date: screening.day,
        screenings: [screening],
      })
    }

    return acc
  }, [])

  // Sort days chronologically
  screeningsByDay.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Limit to visible days
  const visibleScreeningsByDay = screeningsByDay.slice(0, visibleDays)

  // Format day for display
  const formatDay = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Handle additional days input change
  const handleAdditionalDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setAdditionalDays(value)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading screenings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="bg-muted/30 rounded-xl p-4 shadow-sm">
        <Tabs
          defaultValue="all"
          onValueChange={(value) => setActiveSource(value as "all" | "babylon" | "yorck" | "uci")}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-background/80 backdrop-blur-sm">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Film className="h-4 w-4 mr-2" />
                All Cinemas
              </TabsTrigger>
              <TabsTrigger
                value="babylon"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Babylon Berlin
              </TabsTrigger>
              <TabsTrigger
                value="yorck"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Yorck Kino
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md">
              <Switch id="hide-duplicates" checked={hideDuplicates} onCheckedChange={setHideDuplicates} />
              <Label htmlFor="hide-duplicates" className="cursor-pointer">
                Hide duplicate films
              </Label>
            </div>
          </div>
        </Tabs>
      </div>

      {visibleScreeningsByDay.length > 0 ? (
        <>
          {visibleScreeningsByDay.map((dayGroup) => (
            <div key={dayGroup.date} className="space-y-6">
              <h2 className="text-2xl font-bold sticky top-0 bg-background/80 backdrop-blur-sm py-3 z-10 flex items-center border-b">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                {formatDay(dayGroup.date)}
                <Badge className="ml-3" variant="outline">
                  {dayGroup.screenings.length} {dayGroup.screenings.length === 1 ? "film" : "films"}
                </Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dayGroup.screenings
                  .sort((a, b) => {
                    // Sort by time if available
                    if (a.showtimes?.[0]?.time && b.showtimes?.[0]?.time) {
                      return a.showtimes[0].time.localeCompare(b.showtimes[0].time)
                    }
                    return new Date(a.date).getTime() - new Date(b.date).getTime()
                  })
                  .map((screening) => (
                    <FilmCard key={`${screening.title}-${screening.date}-${screening.source}`} screening={screening} />
                  ))}
              </div>
            </div>
          ))}

          <div ref={loadMoreRef} className="py-10 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 bg-muted/30 p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <Label htmlFor="additional-days" className="whitespace-nowrap">
                  Days to load:
                </Label>
                <Input
                  id="additional-days"
                  type="number"
                  min="1"
                  max="14"
                  value={additionalDays}
                  onChange={handleAdditionalDaysChange}
                  className="w-20 bg-background/80"
                />
              </div>

              <Button
                onClick={loadMoreDays}
                disabled={loadingMore}
                size="lg"
                className="bg-primary/90 hover:bg-primary"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading more screenings...
                  </>
                ) : (
                  `Load screenings for ${additionalDays} more days`
                )}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-muted/30 rounded-xl shadow-sm">
          <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-4">
            {searchQuery
              ? "No screenings found matching your search. Try a different search term."
              : 'No upcoming screenings found. Click the "Scrape Latest Screenings" button to fetch data.'}
          </p>
          <Button onClick={() => loadScreenings()} size="lg" className="bg-primary/90 hover:bg-primary">
            Refresh Screenings
          </Button>
        </div>
      )}
    </div>
  )
}
