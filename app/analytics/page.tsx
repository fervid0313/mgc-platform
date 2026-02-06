"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Loader2 } from "lucide-react"

export default function MyAnalyticsRedirectPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAppStore()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user) {
      router.replace("/")
      return
    }

    router.replace(`/profile/${user.id}/analytics`)
  }, [isLoading, isAuthenticated, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
