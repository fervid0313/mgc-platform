"use client"

import { useEffect, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

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

function parseEventTime(timeStr: string, dateStr: string): Date | null {
  if (timeStr === "All Day" || timeStr === "Tentative" || timeStr.includes("Data")) return null

  const match = timeStr.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
  if (!match) return null

  let hour = Number(match[1])
  const minute = match[2] ? Number(match[2]) : 0
  const period = match[3].toLowerCase()

  if (period === "pm" && hour < 12) hour += 12
  if (period === "am" && hour === 12) hour = 0

  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day, hour, minute)
}

export function useEventScheduler() {
  const { user, watchedEvents, loadWatchedEvents, loadNotifications, markNotificationRead } = useAppStore()
  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const firedRef = useRef<Set<string>>(new Set())
  const lockRef = useRef<boolean>(false)

  useEffect(() => {
    if (!user) return
    void loadWatchedEvents()
  }, [user, loadWatchedEvents])

  useEffect(() => {
    if (!user) return
    const userId = user.id

    // Cross-tab lock: only one tab runs the scheduler
    const lockKey = "mgs-event-scheduler-lock"
    const acquireLock = () => {
      if (lockRef.current) return true
      const hasLock = localStorage.getItem(lockKey) === null
      if (hasLock) {
        localStorage.setItem(lockKey, Date.now().toString())
        lockRef.current = true
        // Release lock on unload
        const release = () => {
          if (lockRef.current) {
            localStorage.removeItem(lockKey)
            lockRef.current = false
          }
        }
        window.addEventListener("beforeunload", release)
        window.addEventListener("pagehide", release)
        return true
      }
      return false
    }

    if (!acquireLock()) return

    const tick = async () => {
      const now = new Date()

      // Quiet hours: 10pm–6am (configurable later)
      const hour = now.getHours()
      if (hour >= 22 || hour < 6) return

      const supabase = (await import("@/lib/supabase/client")).createClient()

      for (const watch of watchedEvents) {
        const eventTime = parseEventTime(watch.eventTime, watch.eventDate)
        if (!eventTime) continue

        const diffMs = eventTime.getTime() - now.getTime()
        const diffMinutes = Math.floor(diffMs / 60_000)

        if (diffMinutes !== watch.leadMinutes) continue

        const key = `${watch.eventFingerprint}-${watch.leadMinutes}-${now.getFullYear()}`
        if (firedRef.current.has(key)) {
          console.log("[SCHEDULER] Skipping duplicate:", key)
          continue
        }

        firedRef.current.add(key)
        console.log("[SCHEDULER] Firing reminder for:", watch.eventName, "at", now.toTimeString())

        const message = `Reminder: ${watch.eventName} in ${watch.leadMinutes} minute${watch.leadMinutes > 1 ? "s" : ""} (${watch.eventTime})`

        // Insert notification
        const { error } = await supabase.from("notifications").insert({
          user_id: userId,
          from_user_id: userId,
          type: "event_reminder",
          target_entry_id: null,
          target_entry_content: null,
          message,
          read: false,
        })

        if (error) {
          console.error("[SCHEDULER] Insert error:", error)
          continue
        }

        void loadNotifications()

        // In-app toast
        toast({
          title: "Event reminder",
          description: message,
        })

        // Audio cue
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
          }
          await audioContextRef.current.resume()
          playBeep(audioContextRef.current)
        } catch {
          // ignore
        }
      }
    }

    // Run once now, then every minute
    void tick()
    intervalRef.current = window.setInterval(tick, 60_000) as unknown as NodeJS.Timeout

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
      if (lockRef.current) {
        localStorage.removeItem("mgs-event-scheduler-lock")
        lockRef.current = false
      }
    }
  }, [user, watchedEvents, loadNotifications])

  // Clear fired cache when watchedEvents changes (e.g., unwatch)
 
  useEffect(() => {
    firedRef.current.clear()
  }, [watchedEvents])
}
