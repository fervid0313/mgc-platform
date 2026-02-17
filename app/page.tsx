"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore, appStore } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"
import { JournalFeed } from "@/components/journal-feed"
import { EntryComposer } from "@/components/entry-composer"
import { AuthScreen } from "@/components/auth-screen"
import { CommunityProfiles } from "@/components/community-profiles"
import { OnlineUsers } from "@/components/online-users"
import { FAQ } from "@/components/faq"
import { InviteToSpaceButton } from "@/components/invite-to-space-button"
import { EconomicCalendarButton } from "@/components/economic-calendar-button"
import { JoinPrivateSpaceButton } from "@/components/join-private-space-button"
import { ImportQueue } from "@/components/import-queue"
import { TradeStreaks } from "@/components/trade-streaks"
import { Leaderboard } from "@/components/leaderboard"
import { ToolsPopup } from "@/components/tools-popup"
import { WeeklyReport } from "@/components/weekly-report"
import { AITradeReview } from "@/components/ai-trade-review"
import { EquityCurve } from "@/components/equity-curve"
import { StreakAlert } from "@/components/streak-alert"
import { GoalTracker } from "@/components/goal-tracker"
import { TradeBreakdown } from "@/components/trade-breakdown"
import { TagManager } from "@/components/tag-manager"
import { WeeklyDigest } from "@/components/weekly-digest"
import { CommunityChallenges } from "@/components/community-challenges"
import { MoodCorrelation } from "@/components/mood-correlation"
import { YearlyHeatmap } from "@/components/yearly-heatmap"
import { RiskMetrics } from "@/components/risk-metrics"
import { MonthlyRecap } from "@/components/monthly-recap"
import { MentorshipPairing } from "@/components/mentorship-pairing"
import { QuickAddButton } from "@/components/quick-add-button"
import { StreakNotifier } from "@/components/streak-notifier"
import { TimeOfDayAnalysis } from "@/components/time-of-day-analysis"
import { SymbolPerformance } from "@/components/symbol-performance"
import { WinLossDistribution } from "@/components/win-loss-distribution"
import { TradeIdeas } from "@/components/trade-ideas"
import { CommentNotifier } from "@/components/comment-notifier"
import { TradingInsights } from "@/components/trading-insights"
import { PlaybookBuilder } from "@/components/playbook-builder"
import { RuleEnforcer } from "@/components/rule-enforcer"
import { DrawdownMonitor } from "@/components/drawdown-monitor"
import { SessionView } from "@/components/session-view"
import { TradeComparison } from "@/components/trade-comparison"
import { PushNotificationManager } from "@/components/push-notification-manager"
import IntradayAnalysis from "@/components/intraday-analysis"
import IntelligencePanel from "@/components/intelligence-panel-v2"
import { Loader2, ExternalLink } from "lucide-react"
import { useEventScheduler } from "@/hooks/use-event-scheduler"
import type { ImportedTrade } from "@/lib/types"

const SIDEBAR_COLLAPSED_KEY = "mgc-sidebar-collapsed"

export default function Home() {
  const { isAuthenticated, isLoading, initializeAuth, sidebarOpen, spaces, currentSpaceId, loadEntries } =
    useAppStore()

  // Sidebar collapse state (persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Active tab managed here, driven by sidebar nav
  const [activeTab, setActiveTab] = useState("journal")
  const [mountedTabs, setMountedTabs] = useState({ faq: false, stats: false, community: false, analysis: false })
  const [prefillTrade, setPrefillTrade] = useState<ImportedTrade | null>(null)

  const currentSpace = spaces.find((s) => s.id === currentSpaceId)

  // Event reminder scheduler (runs when authenticated)
  useEventScheduler()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Load collapsed state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (saved === "true") setSidebarCollapsed(true)
    }
  }, [])

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

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }, [])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    // Ensure tab content is mounted on first visit
    if (tab === "faq") setMountedTabs(p => ({ ...p, faq: true }))
    if (tab === "stats") setMountedTabs(p => ({ ...p, stats: true }))
    if (tab === "community") setMountedTabs(p => ({ ...p, community: true }))
    if (tab === "analysis") setMountedTabs(p => ({ ...p, analysis: true }))
  }, [])

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

  // Derive tab visibility from activeTab
  const showFAQ = activeTab === "faq"
  const showStatus = activeTab === "stats"
  const showCommunity = activeTab === "community"
  const showAnalysis = activeTab === "analysis"
  const showJournal = activeTab === "journal"

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="flex flex-1">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-0" : "lg:ml-72"
        } ${sidebarOpen ? "ml-0" : ""}`}>
          <Navbar />

          <main className={`flex-1 mx-auto w-full px-5 pt-10 pb-32 space-y-8 transition-all duration-300 ${
            showAnalysis ? "max-w-full" : "max-w-2xl"
          }`}>
            {/* Lazy-mounted tabs: only render after first visit, then persist via CSS hidden */}
            {mountedTabs.faq && (
              <div className={showFAQ ? "" : "hidden"}>
                <FAQ />
              </div>
            )}

            {mountedTabs.stats && (
              <div className={showStatus ? "space-y-6" : "hidden"}>
                <TradingInsights />
                <DrawdownMonitor />
                <SessionView />
                <RuleEnforcer />
                <EquityCurve />
                <YearlyHeatmap />
                <TradeBreakdown />
                <MoodCorrelation />
                <RiskMetrics />
                <TimeOfDayAnalysis />
                <SymbolPerformance />
                <WinLossDistribution />
                <PlaybookBuilder />
                <TradeComparison />
                <TagManager />
                <TradeStreaks />
                <WeeklyReport />
                <WeeklyDigest />
                <MonthlyRecap />
                <AITradeReview />
              </div>
            )}

            {mountedTabs.analysis && (
              <div className={showAnalysis ? "space-y-6" : "hidden"}>
                <IntelligencePanel />
              </div>
            )}

            {mountedTabs.community && (
              <div className={showCommunity ? "flex flex-col lg:flex-row gap-6 lg:-mx-32 lg:w-[calc(100%+16rem)]" : "hidden"}>
                <div className="flex-1 min-w-0 order-2 lg:order-1">
                  <CommunityProfiles />
                </div>
                <div className="w-full lg:w-72 shrink-0 space-y-5 order-1 lg:order-2">
                  <Leaderboard />
                  <CommunityChallenges />
                  <MentorshipPairing />
                  <TradeIdeas />
                </div>
              </div>
            )}

            {/* Journal — always mounted */}
            <div className={showJournal ? "space-y-6" : "hidden"}>
              <DrawdownMonitor />
              <InviteToSpaceButton />
              <GoalTracker />
              <StreakAlert />
              <ImportQueue onPrefill={(trade) => setPrefillTrade(trade)} />
              <EntryComposer
                prefillTrade={prefillTrade}
                onPrefillConsumed={() => setPrefillTrade(null)}
              />
              <JournalFeed />
            </div>
          </main>
        </div>
      </div>

      {/* Online Users - bottom right */}
      <div className="fixed bottom-16 right-4 lg:right-6 w-64 hidden lg:block">
        <OnlineUsers />
      </div>

      <QuickAddButton />
      <StreakNotifier />
      <CommentNotifier />

      <div className="fixed bottom-6 right-6 lg:right-10">
        <span className="text-xs italic text-muted-foreground/50">Matthew 6:33</span>
      </div>

      {/* Tools Widget - top right */}
      <div className="fixed top-32 right-4 lg:right-6 hidden lg:block">
        <ToolsPopup />
      </div>
    </div>
  )
}
