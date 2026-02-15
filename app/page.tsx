"use client"

import { useState, useEffect, useTransition } from "react"
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
import { IntradayAnalysis } from "@/components/intraday-analysis"
import { Loader2, ExternalLink } from "lucide-react"
import { useEventScheduler } from "@/hooks/use-event-scheduler"
import type { ImportedTrade } from "@/lib/types"

export default function Home() {
  const { isAuthenticated, isLoading, initializeAuth, sidebarOpen, spaces, currentSpaceId, loadEntries } =
    useAppStore()
  const [showCommunity, setShowCommunity] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [mountedTabs, setMountedTabs] = useState({ faq: false, stats: false, community: false, analysis: false })
  const [, startTransition] = useTransition()
  const [prefillTrade, setPrefillTrade] = useState<ImportedTrade | null>(null)

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

          <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-10 pb-32 space-y-8">
            {/* Discord Button */}
            <div className="flex justify-center">
              <a
                href="https://discord.gg/yhrgr3emk2"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-3d flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-900 text-white font-medium rounded-lg transition-all duration-200 border-2 border-white hover:border-white/80"
              >
                <ExternalLink className="h-4 w-4" />
                Join our Discord!
              </a>
            </div>

            <ViewToggle 
              showCommunity={showCommunity} 
              showFAQ={showFAQ}
              showStatus={showStatus}
              showAnalysis={showAnalysis}
              onToggleCommunity={() => { startTransition(() => { setShowCommunity(!showCommunity); setShowStatus(false); setShowAnalysis(false) }); if (!mountedTabs.community) setMountedTabs(p => ({ ...p, community: true })) }}
              onToggleFAQ={() => { startTransition(() => { setShowFAQ(!showFAQ); setShowStatus(false); setShowAnalysis(false) }); if (!mountedTabs.faq) setMountedTabs(p => ({ ...p, faq: true })) }}
              onToggleStatus={() => { startTransition(() => { setShowStatus(!showStatus); setShowCommunity(false); setShowFAQ(false); setShowAnalysis(false) }); if (!mountedTabs.stats) setMountedTabs(p => ({ ...p, stats: true })) }}
              onToggleAnalysis={() => { startTransition(() => { setShowAnalysis(!showAnalysis); setShowCommunity(false); setShowFAQ(false); setShowStatus(false) }); if (!mountedTabs.analysis) setMountedTabs(p => ({ ...p, analysis: true })) }}
            />

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
                <IntradayAnalysis />
              </div>
            )}

            {mountedTabs.community && (
              <div className={showCommunity && !showFAQ && !showStatus ? "flex flex-col lg:flex-row gap-6 lg:-mx-32 lg:w-[calc(100%+16rem)]" : "hidden"}>
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
            <div className={!showFAQ && !showStatus && !showCommunity && !showAnalysis ? "space-y-6" : "hidden"}>
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
