import * as cheerio from "cheerio"
import type { FilmScreening, Showtime } from "./types"
import { readScreeningsFromFile, saveScreeningsToFile } from "./file-utils"

// Get screenings from JSON file
export const getFilmScreenings = async (): Promise<FilmScreening[]> => {
  try {
    return await readScreeningsFromFile()
  } catch (error) {
    return []
  }
}

// Format date as YYYY-MM-DD
const formatDateForUrl = (date: Date): string => {
  return date.toISOString().split("T")[0]
}

// Get current date
const getCurrentDate = (): Date => {
  return new Date()
}

// Get dates for the next N days starting from a specific date
const getNextDays = (startDate: Date, numDays: number): Date[] => {
  const dates: Date[] = []
  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    dates.push(date)
  }
  return dates
}

// Check if a format is one of the desired formats (OmU, OmeU, OV)
const isDesiredFormat = (format: string): boolean => {
  const lowerFormat = format.toLowerCase()
  return lowerFormat.includes("omu") || lowerFormat.includes("omeu") || lowerFormat.includes("ov")
}

// Scrape film screenings from Babylon Berlin website
export const scrapeBabylonScreenings = async (numDays = 3, startDateStr?: string): Promise<FilmScreening[]> => {
  try {
    const response = await fetch("https://babylonberlin.eu/programm", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FilmScraperBot/1.0)",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const screenings: FilmScreening[] = []
    const today = startDateStr ? new Date(startDateStr) : getCurrentDate()

    // Find all film items
    $("li.mix").each((_, element) => {
      try {
        const $el = $(element)

        // Extract data attributes
        const dataTitle = $el.attr("data-title") || ""
        const dataDate = $el.attr("data-date") || ""

        // Extract title
        const titleElement = $el.find(".right-mix h3 a.mix-title")
        const title = titleElement.text().trim()

        // Extract URL
        const url = titleElement.attr("href")
        const fullUrl = url ? `https://babylonberlin.eu${url}` : undefined

        // Extract date and runtime
        const dateElement = $el.find(".right-mix .mix-date")
        const dateText = dateElement.text().trim()

        // Extract runtime from the span.runtime element
        let runtime: string | undefined
        const runtimeSpan = $el.find(".right-mix .mix-date .runtime")
        if (runtimeSpan.length > 0) {
          runtime = runtimeSpan.text().trim()
        }

        // Extract category
        const category = $el.find(".right-mix .mix-category a").text().trim()

        // Extract description
        const description = $el.find(".right-mix .mix-introtext").text().trim()

        // Extract director information
        let director: string | undefined
        const directorMatch = description.match(/R:\s*([^,.]+)/)
        if (directorMatch) {
          director = directorMatch[1].trim()
        }

        // Extract year from description (e.g., "SBZ 1946")
        let year: string | undefined
        const yearMatch = description.match(/\b(19|20)\d{2}\b/)
        if (yearMatch) {
          year = yearMatch[0]
        }

        // Extract image URL
        const imageElement = $el.find(".upper-mix img")
        const imageUrl = imageElement.attr("src") || imageElement.attr("data-src")

        // Extract tags
        const tags: string[] = []
        if ($el.hasClass("tag-highlight")) tags.push("highlight")
        if ($el.hasClass("tag-english-subtitles")) tags.push("english subtitles")
        if ($el.hasClass("tag-premiere")) tags.push("premiere")

        // Add subtitle tags based on description
        if (description.includes("OmU") || title.includes("OmU")) {
          tags.push("OmU")
        }
        if (description.includes("OmeU") || title.includes("OmeU")) {
          tags.push("OmeU")
        }

        // Parse date
        let formattedDate = dataDate
        let screeningDate: Date | null = null

        if (!formattedDate && dateText) {
          // Try to parse date from text like "So, 18.05. 16:00"
          const match = dateText.match(/(\d{2})\.(\d{2})\.\s*(\d{2}):(\d{2})/)
          if (match) {
            const [_, day, month, hours, minutes] = match
            const year = today.getFullYear()
            formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:00`
            screeningDate = new Date(year, Number.parseInt(month) - 1, Number.parseInt(day))
            screeningDate.setHours(Number.parseInt(hours), Number.parseInt(minutes))
          }
        } else if (formattedDate) {
          screeningDate = new Date(formattedDate)
        }

        // Only include screenings for the next numDays days
        if (screeningDate) {
          const daysDiff = Math.floor((screeningDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysDiff >= 0 && daysDiff < numDays) {
            if (title && formattedDate) {
              // Format day for grouping
              const day = screeningDate.toISOString().split("T")[0]

              // Create a showtime
              const showtime: Showtime = {
                time: formattedDate.split(" ")[1].substring(0, 5), // Extract HH:MM
                cinema: "Babylon Berlin",
                url: fullUrl,
              }

              screenings.push({
                title,
                date: formattedDate,
                runtime,
                category,
                description,
                imageUrl,
                url: fullUrl,
                tags: tags.length > 0 ? tags : undefined,
                director,
                year,
                source: "babylon",
                day,
                showtimes: [showtime],
              })
            }
          }
        }
      } catch (error) {
        // Silent error handling
      }
    })

    return screenings
  } catch (error) {
    return []
  }
}

// Scrape film screenings from Yorck Kino website using __NEXT_DATA__
export const scrapeYorckScreenings = async (numDays = 3, startDateStr?: string): Promise<FilmScreening[]> => {
  try {
    const startDate = startDateStr ? new Date(startDateStr) : getCurrentDate()
    const nextDays = getNextDays(startDate, numDays)
    const allScreenings: FilmScreening[] = []
    const now = new Date() // Current date and time for filtering past showtimes

    // Scrape each day
    for (const date of nextDays) {
      const formattedDate = formatDateForUrl(date)
      const url = `https://www.yorck.de/en/films?sort=Popularity&date=${formattedDate}&tab=daily&sessionsExpanded=true`

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FilmScraperBot/1.0)",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        continue
      }

      const html = await response.text()

      // Extract JSON data from __NEXT_DATA__ script tag
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)

      if (!nextDataMatch || !nextDataMatch[1]) {
        continue
      }

      try {
        const nextData = JSON.parse(nextDataMatch[1])
        const films = nextData?.props?.pageProps?.films || []

        // Process each film
        for (const film of films) {
          // Skip films with no sessions
          if (!film.fields.sessions || film.fields.sessions.length === 0) {
            continue
          }

          // Extract film data
          const title = film.fields.title
          const runtime = film.fields.runtime ? `${film.fields.runtime} min` : undefined
          const genre = film.fields.mainLabel
          const description = film.fields.tagline
          const year = film.fields.releaseDate ? film.fields.releaseDate.substring(0, 4) : undefined

          // Extract image URL
          let imageUrl: string | undefined
          if (film.fields.heroImage?.fields?.image?.fields?.file?.url) {
            imageUrl = `https:${film.fields.heroImage.fields.image.fields.file.url}`
          }

          // Create film URL
          const filmSlug = film.fields.slug
          const filmUrl = filmSlug ? `https://www.yorck.de/en/films/${filmSlug}` : undefined

          // Process sessions for this day only
          const dayStart = new Date(formattedDate)
          const dayEnd = new Date(formattedDate)
          dayEnd.setHours(23, 59, 59, 999)

          // Group showtimes by day
          const showtimesByDay: Record<string, Showtime[]> = {}

          for (const session of film.fields.sessions) {
            const startTime = new Date(session.fields.startTime)

            // Skip sessions not on this day
            if (startTime < dayStart || startTime > dayEnd) {
              continue
            }

            // Skip sessions in the past
            if (startTime < now) {
              continue
            }

            // Get format (OmU, DF, etc.)
            const formats = session.fields.formats || []
            const formatStr = formats.join(", ")

            // Skip if not OmU, OmeU, or OV
            if (!formats.some((format) => isDesiredFormat(format))) {
              continue
            }

            const sessionDay = startTime.toISOString().split("T")[0]
            if (!showtimesByDay[sessionDay]) {
              showtimesByDay[sessionDay] = []
            }

            // Format time - FIXED: The issue is that we're getting UTC times from the API
            // but need to display them in local time without adjustment
            const startTimeLocal = new Date(session.fields.startTime)
            // Don't adjust the time - display exactly as provided by the API
            const hours = startTimeLocal.getHours().toString().padStart(2, "0")
            const minutes = startTimeLocal.getMinutes().toString().padStart(2, "0")
            const timeString = `${hours}:${minutes}`

            // Get cinema name
            const cinemaName = session.fields.cinema?.fields?.name

            // Create showtime URL
            const showtimeUrl = `https://www.yorck.de/en/checkout/seatselection?sessionid=${session.sys.id}`

            showtimesByDay[sessionDay].push({
              time: timeString,
              cinema: cinemaName,
              url: showtimeUrl,
              format: formatStr,
              exactDateTime: startTimeLocal.toISOString(), // Store exact date and time for filtering
            })
          }

          // Create a screening for each day that has showtimes
          for (const [day, showtimes] of Object.entries(showtimesByDay)) {
            if (showtimes.length > 0) {
              allScreenings.push({
                title,
                date: `${day} 00:00:00`,
                runtime,
                genre,
                description,
                imageUrl,
                url: filmUrl,
                source: "yorck",
                day,
                showtimes,
                year,
              })
            }
          }
        }
      } catch (error) {
        // Silent error handling for JSON parsing
        console.error("Error parsing Yorck JSON data:", error)
      }
    }

    return allScreenings
  } catch (error) {
    console.error("Error scraping Yorck screenings:", error)
    return []
  }
}

// Scrape and save screenings from all sources
export const scrapeAndSaveScreenings = async (numDays = 3, startDateStr?: string): Promise<FilmScreening[]> => {
  try {
    // Get existing screenings
    const existingScreenings = await getFilmScreenings()

    // Scrape from Babylon and Yorck only
    const babylonScreenings = await scrapeBabylonScreenings(numDays, startDateStr)
    const yorckScreenings = await scrapeYorckScreenings(numDays, startDateStr)

    // Skip UCI scraping
    console.log("UCI Kinowelt scraping disabled")

    // Combine new screenings (without UCI)
    const newScreenings = [...babylonScreenings, ...yorckScreenings]

    // If we're loading more days (startDateStr is provided), merge with existing
    let allScreenings = newScreenings
    if (startDateStr) {
      // Keep screenings from days that aren't in the new batch
      const newDays = new Set(newScreenings.map((s) => s.day))
      // Also filter out any existing UCI screenings
      const filteredExisting = existingScreenings.filter((s) => s.day && !newDays.has(s.day) && s.source !== "uci")
      allScreenings = [...filteredExisting, ...newScreenings]
    }

    // Save to file
    await saveScreeningsToFile(allScreenings)

    return allScreenings
  } catch (error) {
    console.error("Error in scrapeAndSaveScreenings:", error)
    return []
  }
}
