"use server"

import type { FilmScreening, YorckDebugData, UCIDebugData } from "./types"
import { fetchUCIFilmList, fetchUCIFilmShowtimes, parseUCIShowtimes } from "./uci-scraper"

// Add this new function for direct fetch with browser-like headers
export async function fetchUCIDirectWithHeaders(): Promise<{ success: boolean; data: string; status: number }> {
  try {
    const response = await fetch("https://www.uci-kinowelt.de/film/list-all", {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      },
      method: "GET",
      cache: "no-store",
    })

    const status = response.status
    const data = await response.text()

    return {
      success: response.ok,
      data,
      status,
    }
  } catch (error) {
    console.error("Error fetching UCI data with direct headers:", error)
    return {
      success: false,
      data: error instanceof Error ? error.message : "Unknown error occurred",
      status: 500,
    }
  }
}

export async function fetchYorckDebugData(customDate?: string, includeAllFilms = false): Promise<YorckDebugData> {
  try {
    // Use provided date or current date
    const date = customDate || new Date().toISOString().split("T")[0]

    // Construct the URL
    const url = `https://www.yorck.de/en/films?sort=Popularity&date=${date}&tab=daily&sessionsExpanded=true`

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FilmScraperBot/1.0)",
      },
      cache: "no-store",
    })

    const status = response.status
    const rawHtml = await response.text()

    // Extract JSON data from __NEXT_DATA__ script tag
    const nextDataMatch = rawHtml.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)
    let nextData = null
    const parsedFilms: FilmScreening[] = []
    let filmsWithShowtimes = 0
    let totalFilmsInPage = 0

    if (nextDataMatch && nextDataMatch[1]) {
      try {
        nextData = JSON.parse(nextDataMatch[1])
        const films = nextData?.props?.pageProps?.films || []
        totalFilmsInPage = films.length

        // Process each film
        for (const film of films) {
          // Check if film has sessions
          const hasSessions = film.fields.sessions && film.fields.sessions.length > 0

          if (hasSessions) {
            filmsWithShowtimes++
          }

          // Skip films with no sessions unless includeAllFilms is true
          if (!hasSessions && !includeAllFilms) {
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
          const dayStart = new Date(date)
          const dayEnd = new Date(date)
          dayEnd.setHours(23, 59, 59, 999)

          // Extract showtimes
          const showtimes = []

          if (hasSessions) {
            for (const session of film.fields.sessions) {
              const startTime = new Date(session.fields.startTime)

              // Skip sessions not on this day
              if (startTime < dayStart || startTime > dayEnd) {
                continue
              }

              // Format time
              const startTimeLocal = new Date(session.fields.startTime)
              const hours = startTimeLocal.getHours().toString().padStart(2, "0")
              const minutes = startTimeLocal.getMinutes().toString().padStart(2, "0")
              const timeString = `${hours}:${minutes}`

              // Get cinema name
              const cinemaName = session.fields.cinema?.fields?.name

              // Get format (OmU, DF, etc.)
              const formats = session.fields.formats || []

              // Create showtime URL
              const showtimeUrl = `https://www.yorck.de/en/checkout/seatselection?sessionid=${session.sys.id}`

              showtimes.push({
                time: timeString,
                cinema: cinemaName,
                url: showtimeUrl,
                format: formats.join(", "),
              })
            }
          }

          parsedFilms.push({
            title,
            date: `${date} 00:00:00`,
            runtime,
            genre,
            description,
            imageUrl,
            url: filmUrl,
            source: "yorck",
            day: date,
            showtimes: showtimes.length > 0 ? showtimes : undefined,
            year,
          })
        }
      } catch (error) {
        console.error("Error parsing Yorck JSON data:", error)
      }
    }

    return {
      url,
      status,
      date,
      rawHtml,
      parsedFilms,
      filmsWithShowtimes,
      totalFilmsInPage,
      nextData,
    }
  } catch (error) {
    console.error("Error fetching Yorck debug data:", error)
    return {
      url: "Error fetching URL",
      status: 500,
      date: customDate || new Date().toISOString().split("T")[0],
      rawHtml: "Error fetching HTML content",
      parsedFilms: [],
      filmsWithShowtimes: 0,
      totalFilmsInPage: 0,
    }
  }
}

export async function fetchUCIDebugDataWithProxy(customDate?: string, includeAllFilms = false): Promise<UCIDebugData> {
  try {
    // Use provided date or current date
    const date = customDate || new Date().toISOString().split("T")[0]

    // Variables to hold fetched data
    let filmListJson = "[]"
    let showtimesHtml = ""
    const parsedFilms: FilmScreening[] = []
    let filmsWithShowtimes = 0
    let totalFilmsInPage = 0

    try {
      // Fetch the film list
      const films = await fetchUCIFilmList()
      filmListJson = JSON.stringify(films)
      totalFilmsInPage = films.length

      // Process each film (limit to 5 for debug purposes)
      for (const film of films.slice(0, 5)) {
        // Check if film should be included based on release date
        const releaseDate = new Date(film.startdate.date)
        const requestDate = new Date(date)

        // Skip films that haven't been released yet unless includeAllFilms is true
        if (releaseDate > requestDate && !includeAllFilms) {
          continue
        }

        // Fetch showtimes for this film
        const filmShowtimesHtml = await fetchUCIFilmShowtimes(film.id)

        // If this is the first film with HTML, save it for display
        if (!showtimesHtml && filmShowtimesHtml) {
          showtimesHtml = filmShowtimesHtml
        }

        // Parse showtimes for this day
        const showtimes = await parseUCIShowtimes(filmShowtimesHtml, date)

        // Count films with showtimes
        if (showtimes.length > 0) {
          filmsWithShowtimes++
        }

        // Only add films with showtimes unless includeAllFilms is true
        if (showtimes.length > 0 || includeAllFilms) {
          parsedFilms.push({
            title: film.title,
            date: `${date} 00:00:00`,
            runtime: `${film.runtime} min`,
            genre: film.genre,
            description: `FSK ${film.fsk}`,
            imageUrl: film.poster,
            url: `https://www.uci-kinowelt.de/film/${film.seonize}/${film.id}`,
            source: "uci",
            day: date,
            showtimes: showtimes.length > 0 ? showtimes : undefined,
            year: new Date(film.startdate.date).getFullYear().toString(),
          })
        }

        // Add a delay between processing films to avoid detection
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error("Error fetching UCI data with proxy:", error)
    }

    return {
      url: "https://www.uci-kinowelt.de/film/list-all",
      status: 200,
      date,
      rawFilmListJson: filmListJson,
      rawShowtimesHtml: showtimesHtml,
      parsedFilms,
      filmsWithShowtimes,
      totalFilmsInPage,
      mockData: false,
    }
  } catch (error) {
    console.error("Error in fetchUCIDebugDataWithProxy:", error)
    return {
      url: "Error fetching URL",
      status: 500,
      date: customDate || new Date().toISOString().split("T")[0],
      rawFilmListJson: "Error fetching film list",
      rawShowtimesHtml: "Error fetching showtimes HTML",
      parsedFilms: [],
      filmsWithShowtimes: 0,
      totalFilmsInPage: 0,
      mockData: false,
    }
  }
}

export async function fetchUCIDebugData(customDate?: string, includeAllFilms = false): Promise<UCIDebugData> {
  return fetchUCIDebugDataWithProxy(customDate, includeAllFilms)
}

// This function uses a browser to fetch the data, bypassing Cloudflare
export async function fetchUCIDebugDataWithBrowser(
  customDate?: string,
  includeAllFilms = false,
): Promise<UCIDebugData> {
  // Placeholder implementation - replace with actual browser-based scraping logic if needed
  console.warn("fetchUCIDebugDataWithBrowser is a placeholder. Implement browser-based scraping if required.")
  return fetchUCIDebugData(customDate, includeAllFilms)
}
