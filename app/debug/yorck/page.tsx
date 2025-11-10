import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { fetchYorckDebugData } from "@/lib/debug-actions"
import { YorckDebugView } from "@/components/yorck-debug-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function YorckDebugPage() {
  // Fetch debug data directly in the page
  const debugData = await fetchYorckDebugData()

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Yorck Scraper Debug</h1>

      <div className="mb-6">
        <Button asChild>
          <a href="/">Back to Home</a>
        </Button>
      </div>

      <Suspense fallback={<p>Loading debug data...</p>}>
        <YorckDebugView initialData={debugData} />
      </Suspense>
    </div>
  )
}
