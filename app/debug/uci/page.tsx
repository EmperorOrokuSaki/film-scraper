import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { fetchUCIDebugData } from "@/lib/debug-actions"
import { UCIDebugView } from "@/components/uci-debug-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function UCIDebugPage() {
  // Fetch debug data directly in the page
  const debugData = await fetchUCIDebugData()

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">UCI Kinowelt Scraper Debug</h1>

      <div className="mb-6 flex gap-2">
        <Button asChild>
          <a href="/">Back to Home</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/debug/yorck">Yorck Debug</a>
        </Button>
      </div>

      <Suspense fallback={<p>Loading debug data...</p>}>
        <UCIDebugView initialData={debugData} />
      </Suspense>
    </div>
  )
}
