"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchUCIDebugDataWithBrowser } from "@/lib/debug-actions"
import { Loader2 } from "lucide-react"
import type { UCIDebugData } from "@/lib/types"
import { UCIDirectScraper } from "./uci-direct-scraper"

interface UCIDebugViewProps {
  initialData: UCIDebugData
}

export function UCIDebugView({ initialData }: UCIDebugViewProps) {
  const [debugData, setDebugData] = useState<UCIDebugData>(initialData)
  const [loading, setLoading] = useState(false)
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [showAllFilms, setShowAllFilms] = useState(false)
  const [directFetchResult, setDirectFetchResult] = useState<{
    success: boolean
    data: string
    status: number
  } | null>(null)
  const [directFetchLoading, setDirectFetchLoading] = useState(false)

  const refreshData = async (date?: string) => {
    setLoading(true)
    try {
      const newData = await fetchUCIDebugDataWithBrowser(date, showAllFilms)
      setDebugData(newData)
    } catch (error) {
      console.error("Failed to fetch debug data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    refreshData(customDate)
  }

  // Client-side fetch through server proxy
  const handleDirectFetch = async () => {
    setDirectFetchLoading(true)
    try {
      // Create browser-like headers
      const headers = {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        priority: "u=0, i",
        "sec-ch-ua": '"Chromium";v="136", "Brave";v="136", "Not.A/Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "cross-site",
        "sec-fetch-user": "?1",
        "sec-gpc": "1",
        "upgrade-insecure-requests": "1",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      }

      // Use our proxy endpoint
      const proxyResponse = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "https://www.uci-kinowelt.de/film/list-all",
          headers,
        }),
      })

      const proxyResult = await proxyResponse.json()

      setDirectFetchResult({
        success: proxyResult.success,
        data: proxyResult.data,
        status: proxyResult.status,
      })
    } catch (error) {
      console.error("Failed to fetch through proxy:", error)
      setDirectFetchResult({
        success: false,
        data: error instanceof Error ? error.message : "Unknown error occurred",
        status: 0,
      })
    } finally {
      setDirectFetchLoading(false)
    }
  }

  // Function to get format badge color
  const getFormatBadgeColor = (format: string) => {
    if (format.includes("OmU") || format.includes("OV"))
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    if (format.includes("IMAX")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    if (format.includes("iSense")) return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
    if (format.includes("3D")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    if (format.includes("Screen X")) return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }

  // Function to try parsing JSON from the direct fetch result
  const tryParseJson = () => {
    if (!directFetchResult?.data) return null
    try {
      return JSON.parse(directFetchResult.data)
    } catch (e) {
      return null
    }
  }

  // Check if the direct fetch result is valid JSON
  const parsedJson = tryParseJson()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <form onSubmit={handleCustomDateSubmit} className="flex flex-col gap-2 w-full sm:w-auto">
          <Label htmlFor="custom-date">Custom Date</Label>
          <div className="flex gap-2">
            <Input id="custom-date" type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Fetch
            </Button>
          </div>
        </form>

        <Button variant="outline" onClick={() => refreshData()} disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Refresh with Today's Date
        </Button>

        <div className="flex items-center space-x-2 ml-auto">
          <input
            type="checkbox"
            id="show-all-films"
            checked={showAllFilms}
            onChange={(e) => {
              setShowAllFilms(e.target.checked)
              // Don't auto-refresh to avoid unexpected data loads
            }}
            className="h-4 w-4"
          />
          <Label htmlFor="show-all-films">Show all films (including without showtimes)</Label>
        </div>
      </div>

      {/* Server proxy fetch section */}
      <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle>Server Proxy Fetch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will fetch data from UCI Kinowelt through a server proxy to avoid CORS issues. The request will use
              browser-like headers to bypass Cloudflare protection.
            </p>
            <Button
              onClick={handleDirectFetch}
              disabled={directFetchLoading}
              variant="default"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {directFetchLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Fetch via Server Proxy
            </Button>

            {directFetchResult && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${directFetchResult.success ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <p className="font-medium">
                    Status: {directFetchResult.status} {directFetchResult.success ? "(Success)" : "(Failed)"}
                  </p>
                </div>

                {parsedJson ? (
                  <div>
                    <p className="mb-2 text-sm font-medium text-green-600">Successfully parsed JSON data!</p>
                    <p className="mb-2 text-sm">Found {Array.isArray(parsedJson) ? parsedJson.length : 0} films.</p>
                    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[30vh]">
                      <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(parsedJson, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[30vh]">
                    <pre className="text-xs whitespace-pre-wrap break-all">{directFetchResult.data}</pre>
                  </div>
                )}

                {parsedJson && Array.isArray(parsedJson) && parsedJson.length > 0 && (
                  <div className="mt-6">
                    <UCIDirectScraper filmListJson={directFetchResult.data} useProxy={true} />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Film List URL:</strong> {debugData.url}
            </p>
            <p>
              <strong>Status:</strong> {debugData.status}
            </p>
            <p>
              <strong>Date:</strong> {debugData.date}
            </p>
            <p>
              <strong>Films with showtimes:</strong> {debugData.filmsWithShowtimes} / {debugData.totalFilmsInPage}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="parsed">
        <TabsList>
          <TabsTrigger value="parsed">Parsed Films ({debugData.parsedFilms.length})</TabsTrigger>
          <TabsTrigger value="filmList">Film List JSON</TabsTrigger>
          <TabsTrigger value="showtimes">Showtimes HTML</TabsTrigger>
        </TabsList>

        <TabsContent value="parsed" className="space-y-4">
          {debugData.parsedFilms.length > 0 ? (
            debugData.parsedFilms.map((film, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="flex-1">
                    <CardTitle>{film.title || "Untitled Film"}</CardTitle>
                    {film.genre && <p className="text-sm text-muted-foreground mt-1">{film.genre}</p>}
                  </div>
                  {film.imageUrl && (
                    <div className="w-24 h-36 relative overflow-hidden rounded-md shrink-0">
                      <img
                        src={film.imageUrl || "/placeholder.svg"}
                        alt={film.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Film Details</h3>
                      <ul className="space-y-1 text-sm">
                        <li>
                          <strong>URL:</strong>{" "}
                          {film.url ? (
                            <a
                              href={film.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {film.url}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </li>
                        <li>
                          <strong>Runtime:</strong> {film.runtime || "N/A"}
                        </li>
                        <li>
                          <strong>Genre:</strong> {film.genre || "N/A"}
                        </li>
                        <li>
                          <strong>Year:</strong> {film.year || "N/A"}
                        </li>
                        <li>
                          <strong>Description:</strong> {film.description || "N/A"}
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Showtimes ({film.showtimes?.length || 0})</h3>
                      {film.showtimes && film.showtimes.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {film.showtimes.map((showtime, idx) => (
                            <li key={idx} className="border p-2 rounded">
                              <div className="flex justify-between items-center mb-1">
                                <strong className="text-base">{showtime.time}</strong>
                                {showtime.format && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${getFormatBadgeColor(
                                      showtime.format,
                                    )}`}
                                  >
                                    {showtime.format}
                                  </span>
                                )}
                              </div>
                              <div>
                                <strong>Cinema:</strong> {showtime.cinema || "N/A"}
                              </div>
                              <div>
                                <strong>URL:</strong>{" "}
                                {showtime.url ? (
                                  <a
                                    href={showtime.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    View
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">No showtimes available</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-6">
                <p className="text-center text-muted-foreground">No films found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="filmList">
          <Card>
            <CardContent className="py-6">
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[70vh]">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {debugData.rawFilmListJson
                    ? JSON.stringify(JSON.parse(debugData.rawFilmListJson), null, 2)
                    : "No film list data available"}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="showtimes">
          <Card>
            <CardContent className="py-6">
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[70vh]">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {debugData.rawShowtimesHtml.length > 0 ? debugData.rawShowtimesHtml : "No showtimes HTML available"}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
