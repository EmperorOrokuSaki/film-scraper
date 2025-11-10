import type { FilmScreening, Showtime, UCIFilm } from "./types"

// Check if we're in a Node.js environment
const isNode = typeof process !== "undefined" && process.versions && process.versions.node

// Function to fetch the list of films from UCI Kinowelt
export async function fetchUCIFilmList(): Promise<UCIFilm[]> {
  try {
    // Try direct fetch with browser-like headers
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

    if (response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch (e) {
        console.log("Response is not JSON, using proxy instead")
        return []
      }
    }

    // If direct fetch fails, try using our proxy
    const proxyResponse = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://www.uci-kinowelt.de/film/list-all",
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          "cache-control": "max-age=0",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        },
      }),
    })

    if (proxyResponse.ok) {
      const proxyResult = await proxyResponse.json()
      if (proxyResult.success) {
        try {
          return JSON.parse(proxyResult.data)
        } catch (e) {
          console.error("Failed to parse proxy response as JSON", e)
          return []
        }
      }
    }

    // If all methods fail, return empty array
    return []
  } catch (error) {
    console.error("Error fetching UCI film list:", error)
    return []
  }
}

// Function to fetch showtimes for a specific film
export async function fetchUCIFilmShowtimes(filmId: number, cinemaId = "82"): Promise<string> {
  try {
    const url = `https://www.uci-kinowelt.de/film/slider-snippet/${filmId}/${cinemaId}`

    // Try direct fetch with browser-like headers
    try {
      const response = await fetch(url, {
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

      if (response.ok) {
        return await response.text()
      }
    } catch (error) {
      console.log("Direct fetch failed for showtimes, using proxy instead:", error)
    }

    // If direct fetch fails, try using our proxy
    const proxyResponse = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          "cache-control": "max-age=0",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        },
      }),
    })

    if (proxyResponse.ok) {
      const proxyResult = await proxyResponse.json()
      if (proxyResult.success) {
        return proxyResult.data
      }
    }

    return ""
  } catch (error) {
    console.error("Error fetching UCI film showtimes:", error)
    return ""
  }
}

// Function to parse showtimes from HTML using cheerio
export async function parseUCIShowtimes(html: string, date: string): Promise<Showtime[]> {
  try {
    // If HTML is empty, return empty array
    if (!html) {
      return []
    }

    // Dynamically import cheerio to avoid issues with server-side rendering
    const cheerio = await import("cheerio")
    const $ = cheerio.load(html)
    const showtimes: Showtime[] = []

    // Format date for matching with data-date attribute (YYYYMMDD)
    const formattedDateForAttr = date.replace(/-/g, "")

    // Find all date rows for the requested date
    $(`tr[data-date="${formattedDateForAttr}"]`).each((_, dateRow) => {
      // Find all showtime links in this date row
      $(dateRow)
        .find("a.performance")
        .each((_, showtimeLink) => {
          const $link = $(showtimeLink)
          const time = $link.find("span").text().trim()
          const url = `https://www.uci-kinowelt.de${$link.attr("href")}`

          // Determine format
          const classes = $link.attr("class") || ""
          let format = "2D"

          if (classes.includes("isense")) format = "iSense"
          if (classes.includes("imax")) format = "IMAX"
          if (classes.includes("screenx")) format = "Screen X"
          if (classes.includes("3d")) format = format + " 3D"
          if (classes.includes("ov")) format = format + " OV"

          // Create showtime object
          showtimes.push({
            time,
            cinema: "UCI Kinowelt Berlin",
            url,
            format,
            exactDateTime: `${date}T${time}:00`,
          })
        })
    })

    return showtimes
  } catch (error) {
    console.error("Error parsing UCI showtimes:", error)
    return []
  }
}

// Main function to scrape UCI Kinowelt screenings
export async function scrapeUCIScreeningsWithBrowser(numDays = 3, startDateStr?: string): Promise<FilmScreening[]> {
  try {
    const startDate = startDateStr ? new Date(startDateStr) : new Date()
    const allScreenings: FilmScreening[] = []

    // Get the list of films
    console.log("Fetching UCI film list...")
    const films = await fetchUCIFilmList()
    console.log(`Found ${films.length} films`)

    if (films.length === 0) {
      console.warn("No UCI films found, scraping may have failed")
      return []
    }

    // Process each film
    for (const film of films) {
      try {
        console.log(`Processing film: ${film.title} (ID: ${film.id})`)

        // Get showtimes HTML for this film
        const showtimesHtml = await fetchUCIFilmShowtimes(film.id)

        if (!showtimesHtml) {
          console.warn(`No showtimes HTML found for film ${film.id}, skipping`)
          continue
        }

        // Process each day
        for (let i = 0; i < numDays; i++) {
          const currentDate = new Date(startDate)
          currentDate.setDate(currentDate.getDate() + i)
          const formattedDate = currentDate.toISOString().split("T")[0]

          // Skip if the film hasn't been released yet
          const releaseDate = new Date(film.startdate.date)
          if (currentDate < releaseDate) {
            continue
          }

          // Parse showtimes for this day
          const showtimes = await parseUCIShowtimes(showtimesHtml, formattedDate)

          // Only create a screening if there are showtimes
          if (showtimes.length > 0) {
            allScreenings.push({
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
        }

        // Add a delay between processing films to avoid detection
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))
      } catch (error) {
        console.error(`Error processing film ${film.title}:`, error)
        // Continue with next film
      }
    }

    return allScreenings
  } catch (error) {
    console.error("Error scraping UCI screenings:", error)
    return []
  }
}
