"use server"

import { revalidatePath } from "next/cache"
import { scrapeAndSaveScreenings, getFilmScreenings } from "@/lib/scraper"

export async function scrapeFilmScreenings(startDate?: string, numDays = 3) {
  try {
    // Scrape and save screenings from both sources
    const screenings = await scrapeAndSaveScreenings(numDays, startDate)
    revalidatePath("/")
    return { success: true, count: screenings.length }
  } catch (error) {
    throw new Error("Failed to scrape film screenings")
  }
}

export async function getLatestFetchedDay() {
  try {
    const screenings = await getFilmScreenings()

    if (screenings.length === 0) {
      return null
    }

    // Find the latest day in the screenings
    const days = screenings.map((s) => s.day || "").filter(Boolean)
    if (days.length === 0) {
      return null
    }

    // Sort days in descending order and get the latest
    return days.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
  } catch (error) {
    return null
  }
}
