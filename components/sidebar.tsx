"use client"

import { useAppStore } from "@/lib/store"
import { X, Plus, Lock, Users, Globe, LogOut, PanelLeftClose, PanelLeftOpen, BookOpen, BarChart3, Brain, MessageCircleQuestion } from "lucide-react"
import { useState } from "react"
import { CreateSpaceModal } from "./create-space-modal"
import { MilestoneProgress } from "./milestone-progress"
import { MarketTicker } from "./market-ticker"

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const NAV_ITEMS = [
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "stats", label: "Statistics", icon: BarChart3 },
  { id: "community", label: "Community", icon: Users },
  { id: "analysis", label: "Analysis", icon: Brain },
  { id: "faq", label: "FAQ", icon: MessageCircleQuestion },
]

export function Sidebar({ collapsed = false, onToggleCollapse, activeTab = "journal", onTabChange }: SidebarProps) {
  const { sidebarOpen, setSidebarOpen, spaces, currentSpaceId, setCurrentSpace, leaveSpace } = useAppStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <>
      {/* Overlay - mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 glass-3d z-50 shadow-2xl transition-all duration-300 ease-out flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:fixed lg:z-0 ${
          collapsed
            ? "lg:w-0 lg:-translate-x-full"
            : "lg:w-72 lg:translate-x-0"
        } w-72`}
      >
        {/* Top section */}
        <div className="p-6 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs italic text-muted-foreground/50">Exodus 14:14</span>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all hidden lg:flex"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-muted-foreground transition-colors lg:hidden icon-glow"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <MarketTicker />
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pb-3 shrink-0">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 mb-2">Navigation</h3>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange?.(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-border/20 shrink-0" />

        {/* Spaces section */}
        <div className="px-6 pt-3 shrink-0">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Your Spaces</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent overscroll-contain">
          <div className="space-y-1">
            {spaces.map((space) => (
              <div key={space.id} className="relative group">
                <button
                  onClick={() => setCurrentSpace(space.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    space.id === currentSpaceId
                      ? "active-space text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">{space.name}</span>
                    <div className="flex items-center gap-2 pr-6">
                      {space.id === "space-global" ? (
                        <Globe className="h-3 w-3 text-primary" />
                      ) : space.isPrivate ? (
                        <Lock className="h-3 w-3 text-foreground" />
                      ) : (
                        <Users className="h-3 w-3 text-muted-foreground" />
                      )}
                      {space.id !== "space-global" && (
                        <span className="text-[10px] text-muted-foreground">
                          {space.memberCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {space.id !== "space-global" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Leave "${space.name}"? You can rejoin later.`)) {
                        leaveSpace(space.id);
                      }
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all opacity-100"
                    title="Leave space"
                  >
                    <LogOut className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className="p-4 pt-2 space-y-3 shrink-0">
          <MilestoneProgress />
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-3d w-full p-2 rounded-lg bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-foreground font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="h-3 w-3" />
            Create Space
          </button>
        </div>
      </aside>

      {/* Floating expand button - visible when collapsed on desktop */}
      {collapsed && (
        <button
          onClick={onToggleCollapse}
          className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-background/90 border border-border/40 shadow-lg backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-background transition-all duration-200 hidden lg:flex items-center gap-2"
          title="Open sidebar"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      )}

      <CreateSpaceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  )
}
