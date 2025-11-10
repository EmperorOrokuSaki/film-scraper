"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(() => {
      // Create new URLSearchParams
      const params = new URLSearchParams(searchParams)

      // Set or remove search param
      if (searchQuery) {
        params.set("search", searchQuery)
      } else {
        params.delete("search")
      }

      // Update URL
      router.push(`/?${params.toString()}`)
    })
  }

  const clearSearch = () => {
    setSearchQuery("")
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      params.delete("search")
      router.push(`/?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-xl mx-auto gap-2 relative">
      <div className="relative flex-1 group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="h-4 w-4" />
        </div>
        <Input
          type="text"
          placeholder="Search films, directors, year, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 py-6 bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="bg-primary/90 hover:bg-primary px-6 shadow-sm" size="lg">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </form>
  )
}
