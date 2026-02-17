"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Loader2 } from "lucide-react"
import IntelligencePanelV2 from "@/components/intelligence-panel-v2"

export default function IntelligencePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAppStore()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user) {
      router.replace("/")
      return
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="container mx-auto px-4 py-8">
        <IntelligencePanelV2 />
      </div>
    </div>
  )
}
