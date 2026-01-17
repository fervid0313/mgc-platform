"use client"

import { useAppStore } from "@/lib/store"
import { X, Plus, Lock, Users, Globe, LogOut } from "lucide-react"
import { useState } from "react"
import { CreateSpaceModal } from "./create-space-modal"
import { MilestoneProgress } from "./milestone-progress"
import { MarketTicker } from "./market-ticker"

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, spaces, currentSpaceId, setCurrentSpace, leaveSpace } = useAppStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 glass z-50 p-6 shadow-2xl transition-transform duration-400 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-0`}
      >
        <div className="text-center mb-4">
          <span className="text-xs italic text-muted-foreground/50">Exodus 14:14</span>
        </div>

        <MarketTicker />

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Your Spaces</h3>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-muted-foreground transition-colors lg:hidden icon-glow"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-420px)] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent overscroll-contain">
          {console.log("[Sidebar] Rendering spaces:", spaces.length, spaces.map(s => ({ id: s.id, name: s.name })))}
          {spaces.map((space) => (
            <div key={space.id} className="relative group">
              <button
                onClick={() => setCurrentSpace(space.id)}
                className={`w-full p-4 rounded-2xl text-left transition-all ${
                  space.id === currentSpaceId
                    ? "active-space text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate">{space.name}</span>
                  <div className="flex items-center gap-2 pr-8">
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

              {/* Leave button - only show for non-global spaces */}
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

        <div className="absolute bottom-24 left-6 right-6">
          <MilestoneProgress />
        </div>

        <div className="absolute bottom-10 left-6 right-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-3 rounded-xl border border-dashed border-border text-muted-foreground text-xs font-bold hover:border-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Space
          </button>
        </div>
      </aside>

      <CreateSpaceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  )
}
