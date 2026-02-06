"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bell, Check } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"

const SEEN_STORAGE_KEY = "mgs_seen_notification_ids_v1"

function playBeep(audioContext: AudioContext) {
  const osc = audioContext.createOscillator()
  const gain = audioContext.createGain()

  osc.type = "sine"
  osc.frequency.value = 880

  gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12)

  osc.connect(gain)
  gain.connect(audioContext.destination)

  osc.start()
  osc.stop(audioContext.currentTime + 0.13)
}

export function NotificationBell() {
  const { user, notifications, loadNotifications, markNotificationRead, markAllNotificationsRead } = useAppStore()
  const [open, setOpen] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const soundArmedRef = useRef(false)
  const prevUnreadRef = useRef(0)

  const formatNotification = (n: { type: string; message: string }) => {
    if (n.type === "admin_global") {
      try {
        const parsed = JSON.parse(n.message) as { title?: unknown; message?: unknown }
        const title = typeof parsed?.title === "string" ? parsed.title : "Admin"
        const message = typeof parsed?.message === "string" ? parsed.message : n.message
        return { label: "Admin", title, message }
      } catch {
        return { label: "Admin", title: "Admin", message: n.message }
      }
    }

    if (n.type === "like") {
      return { label: "Like", title: "Someone liked your entry", message: n.message }
    }

    if (n.type === "event_reminder") {
      return { label: "Reminder", title: "Event reminder", message: n.message }
    }

    if (n.type === "broadcast_test") {
      return { label: "Broadcast", title: "Broadcast", message: n.message }
    }

    return { label: n.type, title: n.type, message: n.message }
  }

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  useEffect(() => {
    if (!user) return
    void loadNotifications()

    const interval = window.setInterval(() => {
      void loadNotifications()
    }, 60_000)

    return () => window.clearInterval(interval)
  }, [user, loadNotifications])

  useEffect(() => {
    const prevUnread = prevUnreadRef.current
    prevUnreadRef.current = unreadCount

    if (!user) return
    if (unreadCount <= prevUnread) return
    if (!soundArmedRef.current) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      void audioContextRef.current.resume()
      playBeep(audioContextRef.current)
    } catch {
      // ignore
    }

    const newestUnread = notifications.find((n) => !n.read)
    if (!newestUnread) return

    try {
      const raw = localStorage.getItem(SEEN_STORAGE_KEY)
      const seen = raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
      if (seen[newestUnread.id]) return

      seen[newestUnread.id] = true
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(seen))
    } catch {
      // ignore
    }

    toast({
      title: "New notification",
      description: formatNotification(newestUnread).message,
    })
  }, [unreadCount, notifications, user])

  if (!user) return null

  const isAdmin = user.email === "fervid2023@gmail.com"

  const sendBroadcastTest = async () => {
    try {
      const res = await fetch("/api/notifications/broadcast", { method: "POST" })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      toast({
        title: "Broadcast sent",
        description: `Inserted ${data?.inserted ?? 0} notifications`,
      })
      void loadNotifications()
    } catch (e) {
      toast({
        title: "Broadcast failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const checkBroadcastStatus = async () => {
    try {
      const res = await fetch("/api/notifications/broadcast/status")
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      toast({
        title: "Broadcast status",
        description: `Profiles: ${data?.profiles ?? 0} | Delivered: ${data?.haveLatest ?? 0} | Missing: ${data?.missingLatest ?? 0}`,
      })
    } catch (e) {
      toast({
        title: "Status check failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const sendAdminGlobal = async () => {
    const title = window.prompt("Notification title?")
    if (!title) return

    const message = window.prompt("Notification message?")
    if (!message) return

    try {
      const res = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      toast({
        title: "Global notification sent",
        description: `Inserted ${data?.inserted ?? 0} notifications`,
      })
      void loadNotifications()
    } catch (e) {
      toast({
        title: "Send failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={(next) => {
      setOpen(next)
      if (next) {
        soundArmedRef.current = true
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
          }
          void audioContextRef.current.resume()
        } catch {
          // ignore
        }
      }
    }}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors icon-glow"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => void markAllNotificationsRead()}
            disabled={unreadCount === 0}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Mark all read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isAdmin && (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                void sendBroadcastTest()
              }}
            >
              Send test notification to everyone
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                void sendAdminGlobal()
              }}
            >
              Send global notification (custom)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                void checkBroadcastStatus()
              }}
            >
              Verify broadcast delivery
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.slice(0, 30).map((n) => (
              (() => {
                const f = formatNotification(n)
                return (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start gap-1 py-3 ${n.read ? "opacity-70" : ""}`}
                onSelect={(e) => {
                  e.preventDefault()
                  if (!n.read) {
                    void markNotificationRead(n.id)
                  }
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-foreground">{f.label}</span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="text-xs text-foreground leading-snug">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-snug">{f.message}</div>
              </DropdownMenuItem>
                )
              })()
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
