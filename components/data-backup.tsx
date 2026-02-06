"use client"

import { useState, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { Download, Upload, Database, Check } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export function DataBackup() {
  const { entries, currentSpaceId, user } = useAppStore()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [imported, setImported] = useState(false)

  const handleExport = () => {
    if (!currentSpaceId || !user) return
    const userEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      userId: user.id,
      username: user.username,
      spaceId: currentSpaceId,
      entries: userEntries,
      localStorage: {
        goals: {
          weekly: localStorage.getItem("mgc-goal-weekly"),
          monthly: localStorage.getItem("mgc-goal-monthly"),
        },
        templates: localStorage.getItem("mgc-trade-templates"),
        savedFilters: localStorage.getItem("mgc-saved-filters"),
        bookmarks: localStorage.getItem("mgc-bookmarks"),
        follows: localStorage.getItem("mgc-follows"),
        challenges: localStorage.getItem("mgc-community-challenges"),
        notificationPrefs: localStorage.getItem("mgc-notification-prefs"),
        colorMode: localStorage.getItem("mgc-color-mode"),
      },
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mgc-backup-${format(new Date(), "yyyy-MM-dd")}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Backup exported", description: `${userEntries.length} entries saved` })
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target?.result as string)
        if (!backup.version || !backup.localStorage) {
          toast({ title: "Invalid backup", description: "This file doesn't appear to be a valid MGC backup." })
          return
        }

        const ls = backup.localStorage
        if (ls.goals?.weekly) localStorage.setItem("mgc-goal-weekly", ls.goals.weekly)
        if (ls.goals?.monthly) localStorage.setItem("mgc-goal-monthly", ls.goals.monthly)
        if (ls.templates) localStorage.setItem("mgc-trade-templates", ls.templates)
        if (ls.savedFilters) localStorage.setItem("mgc-saved-filters", ls.savedFilters)
        if (ls.bookmarks) localStorage.setItem("mgc-bookmarks", ls.bookmarks)
        if (ls.follows) localStorage.setItem("mgc-follows", ls.follows)
        if (ls.challenges) localStorage.setItem("mgc-community-challenges", ls.challenges)
        if (ls.notificationPrefs) localStorage.setItem("mgc-notification-prefs", ls.notificationPrefs)
        if (ls.colorMode) localStorage.setItem("mgc-color-mode", ls.colorMode)

        setImported(true)
        toast({ title: "Backup restored", description: "Settings and preferences have been restored. Refresh to apply." })
        setTimeout(() => setImported(false), 3000)
      } catch {
        toast({ title: "Import failed", description: "Could not parse the backup file." })
      }
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="glass-3d rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold">Data Backup</h3>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold bg-secondary/30 border border-border/50 rounded-xl hover:border-primary/50 hover:text-primary transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold bg-secondary/30 border border-border/50 rounded-xl hover:border-primary/50 hover:text-primary transition-all"
        >
          {imported ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Upload className="h-3.5 w-3.5" />}
          {imported ? "Restored!" : "Import"}
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>
      <p className="text-[9px] text-muted-foreground">Export your entries, goals, templates, and preferences as JSON.</p>
    </div>
  )
}
