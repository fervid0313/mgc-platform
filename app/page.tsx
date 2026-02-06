"use client"

import { useState, useEffect } from "react"
import { useAppStore, appStore } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { JournalFeed } from "@/components/journal-feed"
import { EntryComposer } from "@/components/entry-composer"
import { AuthScreen } from "@/components/auth-screen"
import { CommunityProfiles } from "@/components/community-profiles"
import { OnlineUsers } from "@/components/online-users"
import { ViewToggle } from "@/components/view-toggle"
import { FAQ } from "@/components/faq"
import { InviteToSpaceButton } from "@/components/invite-to-space-button"
import { EconomicCalendarButton } from "@/components/economic-calendar-button"
import { JoinPrivateSpaceButton } from "@/components/join-private-space-button"
import { Loader2, ExternalLink } from "lucide-react"
import { useEventScheduler } from "@/hooks/use-event-scheduler"

export default function Home() {
  const { isAuthenticated, isLoading, initializeAuth, sidebarOpen, spaces, currentSpaceId, loadEntries } =
    useAppStore()
  const [showCommunity, setShowCommunity] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)

  const currentSpace = spaces.find((s) => s.id === currentSpaceId)

  // Event reminder scheduler (runs when authenticated)
  useEventScheduler()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Attach store to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storeState = appStore.getState()
      ;(window as any).store = appStore
      ;(window as any).debugJournal = () => storeState.debugJournal()
      ;(window as any).debugExistingEntries = () => storeState.debugExistingEntries()
      ;(window as any).debugAllEntries = () => storeState.debugAllEntries()
      console.log("[PAGE] Store attached to window:", typeof (window as any).store)
      console.log("[PAGE] Store methods:", Object.keys(storeState))
      console.log("[PAGE] Debug functions available: window.debugJournal(), window.debugExistingEntries(), window.debugAllEntries()")
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

        <div className={`flex-1 flex flex-col transition-all duration-400 lg:ml-72 ${sidebarOpen ? "ml-0" : ""}`}>
          <Navbar />

          <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-8 pb-32">
            {/* Discord Button */}
            <div className="flex justify-center mb-6">
              <a
                href="https://discord.gg/yhrgr3emk2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-900 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white hover:border-white/80"
              >
                <ExternalLink className="h-4 w-4" />
                Join our Discord!
              </a>
            </div>

            <ViewToggle 
              showCommunity={showCommunity} 
              showFAQ={showFAQ}
              onToggleCommunity={() => setShowCommunity(!showCommunity)}
              onToggleFAQ={() => setShowFAQ(!showFAQ)}
            />

            {showFAQ ? (
              <FAQ />
            ) : showCommunity ? (
              <>
                <div className="flex gap-4 mb-6">
                  <EconomicCalendarButton />
                  <JoinPrivateSpaceButton />
                </div>
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

      {/* Online Users Widget */}
      <div className="fixed top-32 right-4 lg:right-6 w-64 hidden lg:block">
        <OnlineUsers />
      </div>
    </div>
  )
}
