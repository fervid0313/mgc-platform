"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { LogOut, Shield, Plus, User } from "lucide-react"
import { VibeIndicator } from "./vibe-indicator"
import { ProfileDetails } from "./profile-details"
import { JoinPublicGroup } from "./join-public-group"
import { CreateSpaceModal } from "./create-space-modal"
import { NotificationBell } from "./notification-bell"
import { useEffect } from "react"

export function Navbar() {
  const { toggleSidebar, spaces, currentSpaceId, user, logout, getCollectiveVibe, isAdmin } = useAppStore()
  const currentSpace = spaces.find((s) => s.id === currentSpaceId)
  const vibe = getCollectiveVibe()
  const [showProfileDetails, setShowProfileDetails] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const userIsAdmin = isAdmin()

  useEffect(() => {
    if (vibe) {
      document.documentElement.setAttribute("data-vibe", vibe)
    } else {
      document.documentElement.removeAttribute("data-vibe")
    }
  }, [vibe])

  return (
    <>
      <nav className="sticky top-0 z-30 glass px-6 py-5 flex justify-between items-center">
        <button onClick={toggleSidebar} className="p-2 -ml-2 lg:hidden icon-glow">
          <div className="w-6 h-0.5 bg-foreground mb-1.5" />
          <div className="w-4 h-0.5 bg-muted-foreground" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold tracking-tight text-2xl text-foreground italic">MGS</h1>
            {userIsAdmin && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30">
                <Shield className="w-3 h-3" />
                ADMIN
              </span>
            )}
          </div>
          <span className="text-[8px] font-medium text-muted-foreground tracking-[0.15em]">MIND · GRIND · SCALE</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <JoinPublicGroup />
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Private Space</span>
            </button>
            <div className="w-px h-6 bg-border" />
            <VibeIndicator />
          </div>
          {currentSpace && (
            <div className="text-[10px] font-bold text-foreground bg-primary/10 px-3 py-1 rounded-full border border-primary/20 uppercase hidden md:block">
              {currentSpace.name}
            </div>
          )}
          <NotificationBell />
          {user && (
            <button
              onClick={() => setShowProfileDetails(true)}
              className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors icon-glow"
              title="Profile Details"
            >
              <User className="h-4 w-4" />
            </button>
          )}
          {user && (
            <button
              onClick={logout}
              className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors icon-glow"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </nav>

      <ProfileDetails isOpen={showProfileDetails} onClose={() => setShowProfileDetails(false)} />
      <CreateSpaceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  )
}
