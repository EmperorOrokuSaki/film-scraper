import { Suspense } from "react"
import { FilmTimeline } from "@/components/film-timeline"
import { FilmTimelineSkeleton } from "@/components/film-timeline-skeleton"
import { ScrapeButton } from "@/components/scrape-button"
import { SearchBar } from "@/components/search-bar"
import { scrapeFilmScreenings } from "@/lib/actions"

// Use dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Home() {
  // Always scrape on page load to ensure fresh data
  try {
    // Use a more direct approach to ensure data is loaded
    const result = await scrapeFilmScreenings(undefined, 3)
    console.log(`Initial load: ${result.count} screenings loaded`)
  } catch (error) {
    console.error("Error loading initial data:", error)
    // Silent error handling for user
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto py-12 px-4">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Berlin Film Screenings
          </h1>
          <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
            Discover upcoming film screenings from Babylon Berlin and Yorck Kino
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <ScrapeButton />
          </div>
          <SearchBar />
        </header>

        <main>
          <Suspense fallback={<FilmTimelineSkeleton />}>
            <FilmTimeline />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
