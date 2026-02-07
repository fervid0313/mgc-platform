"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, BellRing } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type PermissionState = "default" | "granted" | "denied"

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>("default")
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const isSupported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator
    setSupported(isSupported)
    if (isSupported) {
      setPermission(Notification.permission as PermissionState)
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!supported) return false
    const result = await Notification.requestPermission()
    setPermission(result as PermissionState)
    return result === "granted"
  }

  const sendLocalPush = (title: string, body: string, tag?: string) => {
    if (permission !== "granted" || !supported) return
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: tag || "mgc-local",
      } as NotificationOptions)
    })
  }

  return { permission, supported, requestPermission, sendLocalPush }
}

export function PushNotificationManager() {
  const { permission, supported, requestPermission, sendLocalPush } = usePushNotifications()
  const { toast } = useToast()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    setEnabled(localStorage.getItem("mgc-push-enabled") === "true")
  }, [])

  if (!supported) return null

  const handleToggle = async () => {
    if (permission === "denied") {
      toast({ title: "Notifications blocked", description: "Please enable notifications in your browser settings." })
      return
    }

    if (!enabled) {
      const granted = await requestPermission()
      if (granted) {
        setEnabled(true)
        localStorage.setItem("mgc-push-enabled", "true")
        toast({ title: "Push notifications enabled", description: "You'll get alerts for streaks, comments, and more." })
        sendLocalPush("MGS Platform", "Push notifications are now active! 🔔")
      }
    } else {
      setEnabled(false)
      localStorage.setItem("mgc-push-enabled", "false")
      toast({ title: "Push notifications disabled" })
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border transition-all ${
        enabled
          ? "border-primary/30 bg-primary/10 text-primary"
          : permission === "denied"
          ? "border-red-500/30 bg-red-500/5 text-red-400"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
      }`}
      title={permission === "denied" ? "Notifications blocked in browser settings" : enabled ? "Disable push notifications" : "Enable push notifications"}
    >
      {enabled ? <BellRing className="h-3.5 w-3.5" /> : permission === "denied" ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
      {enabled ? "Push On" : permission === "denied" ? "Blocked" : "Enable Push"}
    </button>
  )
}
