"use client"

export function SkeletonCard() {
  return (
    <div className="glass-3d rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/50" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-24 bg-secondary/50 rounded" />
          <div className="h-2 w-16 bg-secondary/30 rounded" />
        </div>
        <div className="h-5 w-14 bg-secondary/40 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-secondary/30 rounded" />
        <div className="h-3 w-3/4 bg-secondary/30 rounded" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 w-12 bg-secondary/20 rounded" />
        <div className="h-3 w-12 bg-secondary/20 rounded" />
      </div>
    </div>
  )
}

export function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonLine({ width = "full" }: { width?: string }) {
  return <div className={`h-3 bg-secondary/30 rounded animate-pulse w-${width}`} />
}
