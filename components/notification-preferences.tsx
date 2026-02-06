"use client"

import { useState, useEffect } from "react"
import { Settings, BellOff, Clock, X } from "lucide-react"

interface NotificationPrefs {
  muteLikes: boolean
  muteComments: boolean
  muteFollows: boolean
  quietHoursEnabled: boolean
  quietStart: string
  quietEnd: string
}

const STORAGE_KEY = "mgc-notification-prefs"

const defaultPrefs: NotificationPrefs = {
  muteLikes: false,
  muteComments: false,
  muteFollows: false,
  quietHoursEnabled: false,
  quietStart: "22:00",
  quietEnd: "08:00",
}

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setPrefs(JSON.parse(saved))
    } catch {}
  }, [])

  const updatePrefs = (update: Partial<NotificationPrefs>) => {
    const next = { ...prefs, ...update }
    setPrefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const isInQuietHours = () => {
    if (!prefs.quietHoursEnabled) return false
    const now = new Date()
    const [startH, startM] = prefs.quietStart.split(":").map(Number)
    const [endH, endM] = prefs.quietEnd.split(":").map(Number)
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }

  const shouldNotify = (type: "like" | "comment" | "follow") => {
    if (isInQuietHours()) return false
    if (type === "like" && prefs.muteLikes) return false
    if (type === "comment" && prefs.muteComments) return false
    if (type === "follow" && prefs.muteFollows) return false
    return true
  }

  return { prefs, updatePrefs, shouldNotify, isInQuietHours }
}

export function NotificationPreferences() {
  const { prefs, updatePrefs } = useNotificationPrefs()
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-3d p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
        title="Notification preferences"
      >
        <Settings className="h-4 w-4 text-muted-foreground" />
      </button>
    )
  }

  return (
    <div className="glass-3d rounded-2xl p-4 w-72 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Settings className="h-4 w-4" /> Notification Settings
        </h3>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary/50">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-muted-foreground">Mute like notifications</span>
          <input
            type="checkbox"
            checked={prefs.muteLikes}
            onChange={(e) => updatePrefs({ muteLikes: e.target.checked })}
            className="accent-primary"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-muted-foreground">Mute comment notifications</span>
          <input
            type="checkbox"
            checked={prefs.muteComments}
            onChange={(e) => updatePrefs({ muteComments: e.target.checked })}
            className="accent-primary"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-muted-foreground">Mute follow notifications</span>
          <input
            type="checkbox"
            checked={prefs.muteFollows}
            onChange={(e) => updatePrefs({ muteFollows: e.target.checked })}
            className="accent-primary"
          />
        </label>
      </div>

      <div className="border-t border-border pt-3 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-bold flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Quiet Hours
          </span>
          <input
            type="checkbox"
            checked={prefs.quietHoursEnabled}
            onChange={(e) => updatePrefs({ quietHoursEnabled: e.target.checked })}
            className="accent-primary"
          />
        </label>
        {prefs.quietHoursEnabled && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="time"
              value={prefs.quietStart}
              onChange={(e) => updatePrefs({ quietStart: e.target.value })}
              className="bg-secondary/30 border border-border/50 rounded-lg px-2 py-1 text-xs"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="time"
              value={prefs.quietEnd}
              onChange={(e) => updatePrefs({ quietEnd: e.target.value })}
              className="bg-secondary/30 border border-border/50 rounded-lg px-2 py-1 text-xs"
            />
          </div>
        )}
      </div>
    </div>
  )
}
