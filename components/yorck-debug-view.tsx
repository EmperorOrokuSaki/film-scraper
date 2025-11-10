"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchYorckDebugData } from "@/lib/debug-actions"
import { Loader2 } from "lucide-react"
import type { YorckDebugData } from "@/lib/types"

interface YorckDebugViewProps {
  initialData: YorckDebugData
}

export function YorckDebugView({ initialData }: YorckDebugViewProps) {
  const [debugData, setDebugData] = useState<YorckDebugData>(initialData)
  const [loading, setLoading] = useState(false)
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [showAllFilms, setShowAllFilms] = useState(false)

  const refreshData = async (date?: string) => {
    setLoading(true)
    try {
      const newData = await fetchYorckDebugData(date, showAllFilms)
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

      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>URL:</strong> {debugData.url}
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
          <TabsTrigger value="json">JSON Data</TabsTrigger>
          <TabsTrigger value="raw">Raw HTML</TabsTrigger>
        </TabsList>

        <TabsContent value="parsed" className="space-y-4">
          {debugData.parsedFilms.length > 0 ? (
            debugData.parsedFilms.map((film, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{film.title || "Untitled Film"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Film Details</h3>
                      <ul className="space-y-1 text-sm">
                        <li>
                          <strong>URL:</strong> {film.url || "N/A"}
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
                          <strong>Image URL:</strong>{" "}
                          {film.imageUrl ? (
                            <a
                              href={film.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline break-all"
                            >
                              {film.imageUrl.substring(0, 50)}...
                            </a>
                          ) : (
                            "N/A"
                          )}
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
                              <strong>Time:</strong> {showtime.time}
                              <br />
                              <strong>Cinema:</strong> {showtime.cinema || "N/A"}
                              <br />
                              <strong>Format:</strong> {showtime.format || "N/A"}
                              <br />
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

        <TabsContent value="json">
          <Card>
            <CardContent className="py-6">
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[70vh]">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {debugData.nextData ? JSON.stringify(debugData.nextData, null, 2) : "No JSON data available"}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw">
          <Card>
            <CardContent className="py-6">
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[70vh]">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {debugData.rawHtml.length > 0 ? debugData.rawHtml : "No HTML content available"}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
