"use client"

import { useState, useEffect } from "react"
import { useAppStore, appStore } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { JournalFeed } from "@/components/journal-feed"
import { EntryComposer } from "@/components/entry-composer"
import { AuthScreen } from "@/components/auth-screen"
import { CommunityProfiles } from "@/components/community-profiles"
import { ViewToggle } from "@/components/view-toggle"
import { InviteToSpaceButton } from "@/components/invite-to-space-button"
import { JoinPrivateSpaceButton } from "@/components/join-private-space-button"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { isAuthenticated, isLoading, initializeAuth, sidebarOpen, spaces, currentSpaceId, loadEntries } =
    useAppStore()
  const [showCommunity, setShowCommunity] = useState(false)

  const currentSpace = spaces.find((s) => s.id === currentSpaceId)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Attach store to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).store = appStore
      console.log("[PAGE] Store attached to window:", typeof (window as any).store)
      console.log("[PAGE] Store methods:", Object.keys(appStore.getState()))
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && currentSpaceId) {
      loadEntries(currentSpaceId)
    }
  }, [isAuthenticated, currentSpaceId, loadEntries])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="flex flex-1">
        <Sidebar />

        <div className={`flex-1 flex flex-col transition-all duration-400 ${sidebarOpen ? "lg:ml-0" : ""}`}>
          <Navbar />

          <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-8 pb-32">
            <ViewToggle showCommunity={showCommunity} onToggleCommunity={() => setShowCommunity(!showCommunity)} />

            {showCommunity ? (
              <>
                <JoinPrivateSpaceButton />
                <CommunityProfiles />
              </>
            ) : (
              <>
                <InviteToSpaceButton />
                <EntryComposer />
                <JournalFeed />
              </>
            )}
          </main>
        </div>
      </div>

      <div className="fixed bottom-10 right-6 lg:right-10">
        <span className="text-xs italic text-muted-foreground/50">Matthew 6:33</span>
      </div>
    </div>
  )
}
