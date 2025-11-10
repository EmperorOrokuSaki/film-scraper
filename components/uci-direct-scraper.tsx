"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { FilmScreening, UCIFilm } from "@/lib/types"
import { parseUCIShowtimes } from "@/lib/uci-scraper"

interface UCIDirectScraperProps {
  filmListJson: string
  useProxy?: boolean
}

export function UCIDirectScraper({ filmListJson, useProxy = false }: UCIDirectScraperProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    films: FilmScreening[]
    processed: number
    total: number
    errors: string[]
  } | null>(null)

  const processFilms = async () => {
    setLoading(true)
    const errors: string[] = []
    const films: FilmScreening[] = []
    let processed = 0

    try {
      // Parse the film list JSON
      const filmList: UCIFilm[] = JSON.parse(filmListJson)
      const total = filmList.length

      // Process each film
      for (const film of filmList.slice(0, 5)) {
        // Limit to 5 films for testing
        try {
          processed++

          // Create browser-like headers
          const headers = {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "max-age=0",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
          }

          let showtimesHtml = ""

          if (useProxy) {
            // Fetch showtimes through the proxy
            const proxyResponse = await fetch("/api/proxy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: `https://www.uci-kinowelt.de/film/slider-snippet/${film.id}/82`,
                headers,
              }),
            })

            const proxyResult = await proxyResponse.json()

            if (!proxyResult.success) {
              errors.push(`Failed to fetch showtimes for film ${film.id}: ${proxyResult.status}`)
              continue
            }

            showtimesHtml = proxyResult.data
          } else {
            // Direct fetch (will likely fail due to CORS)
            try {
              const response = await fetch(`https://www.uci-kinowelt.de/film/slider-snippet/${film.id}/82`, {
                headers,
                method: "GET",
              })

              if (!response.ok) {
                errors.push(`Failed to fetch showtimes for film ${film.id}: ${response.status}`)
                continue
              }

              showtimesHtml = await response.text()
            } catch (error) {
              errors.push(
                `CORS error fetching showtimes for film ${film.id}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              )
              continue
            }
          }

          // Get today's date
          const today = new Date()
          const formattedDate = today.toISOString().split("T")[0]

          // Parse showtimes
          const showtimes = await parseUCIShowtimes(showtimesHtml, formattedDate)

          // Only add films with showtimes
          if (showtimes.length > 0) {
            films.push({
              title: film.title,
              date: `${formattedDate} 00:00:00`,
              runtime: `${film.runtime} min`,
              genre: film.genre,
              description: `FSK ${film.fsk}`,
              imageUrl: film.poster,
              url: `https://www.uci-kinowelt.de/film/${film.seonize}/${film.id}`,
              source: "uci",
              day: formattedDate,
              showtimes,
              year: new Date(film.startdate.date).getFullYear().toString(),
            })
          }

          // Add a delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Update results as we go
          setResults({
            films,
            processed,
            total,
            errors,
          })
        } catch (error) {
          errors.push(`Error processing film ${film.title}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      // Final update
      setResults({
        films,
        processed,
        total: filmList.length,
        errors,
      })
    } catch (error) {
      errors.push(`Failed to parse film list JSON: ${error instanceof Error ? error.message : String(error)}`)
      setResults({
        films: [],
        processed: 0,
        total: 0,
        errors,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle>Process Films with {useProxy ? "Server Proxy" : "Browser"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will process the film list JSON and fetch showtimes for each film{" "}
            {useProxy ? "through the server proxy" : "directly using your browser"}.
          </p>

          <Button
            onClick={processFilms}
            disabled={loading || !filmListJson}
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Process Films (Test with 5 films)
          </Button>

          {results && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  Processed: {results.processed} / {results.total}
                </p>
                <p className="font-medium">Films with showtimes: {results.films.length}</p>
              </div>

              {results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Errors ({results.errors.length}):</h4>
                  <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-md text-sm">
                    <ul className="list-disc pl-5 space-y-1">
                      {results.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {results.films.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Films with Showtimes:</h4>
                  <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[30vh]">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {JSON.stringify(results.films, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
