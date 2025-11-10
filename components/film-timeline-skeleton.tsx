import { Skeleton } from "@/components/ui/skeleton"

export function FilmTimelineSkeleton() {
  return (
    <div className="space-y-12">
      {[1, 2].map((day) => (
        <div key={day} className="space-y-6">
          <Skeleton className="h-10 w-64 rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                <Skeleton className="h-56 w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="pt-3">
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
