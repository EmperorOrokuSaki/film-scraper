"use client"

import { useState } from "react"
import { scrapeFilmScreenings } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function ScrapeButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleScrape = async () => {
    setIsLoading(true)
    try {
      // Start from today with default 3 days
      const result = await scrapeFilmScreenings(undefined, 3)
      toast({
        title: "Success!",
        description: `${result.count} film screenings have been updated.`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to scrape film screenings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return null
}
