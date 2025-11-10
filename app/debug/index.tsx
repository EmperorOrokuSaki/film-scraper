import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function DebugIndex() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Film Scraper Debug Tools</h1>

      <div className="mb-6">
        <Button asChild>
          <a href="/">Back to Home</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Yorck Kino Debug</CardTitle>
            <CardDescription>Inspect raw data from Yorck Kino website</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              View the raw JSON data, parsed films, and showtimes from the Yorck Kino website.
            </p>
            <Button asChild>
              <Link href="/debug/yorck">Open Yorck Debug</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>UCI Kinowelt Debug</CardTitle>
            <CardDescription>Inspect raw data from UCI Kinowelt website</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              View the raw JSON data, parsed films, and showtimes from the UCI Kinowelt website.
            </p>
            <Button asChild>
              <Link href="/debug/uci">Open UCI Debug</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Babylon Berlin Debug</CardTitle>
            <CardDescription>Inspect raw data from Babylon Berlin website</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              View the raw HTML, parsed films, and showtimes from the Babylon Berlin website.
            </p>
            <Button asChild disabled>
              <Link href="/debug/babylon">Coming Soon</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
