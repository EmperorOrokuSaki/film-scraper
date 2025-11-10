import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date, format: "full" | "date-only" | "time-only" = "full"): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  }

  try {
    if (format === "date-only") {
      return date.toLocaleDateString("en-US", options)
    } else if (format === "time-only") {
      return date.toLocaleTimeString("en-US", timeOptions)
    } else {
      return `${date.toLocaleDateString("en-US", options)} at ${date.toLocaleTimeString("en-US", timeOptions)}`
    }
  } catch (error) {
    console.error("Error formatting date:", error)
    return date.toString()
  }
}
