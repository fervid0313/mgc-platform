"use client"

import { useEffect, useRef } from "react"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

const LAST_COMMENT_KEY = "mgc-last-comment-check"

export function CommentNotifier() {
  const { entries, currentSpaceId, user } = useAppStore()
  const { toast } = useToast()
  const checked = useRef(false)

  useEffect(() => {
    if (!currentSpaceId || !user || checked.current) return
    checked.current = true

    const myEntries = (entries[currentSpaceId] || []).filter((e) => e.userId === user.id)
    if (myEntries.length === 0) return

    const lastCheck = parseInt(localStorage.getItem(LAST_COMMENT_KEY) || "0")
    const now = Date.now()
    localStorage.setItem(LAST_COMMENT_KEY, String(now))

    const { getComments } = useAppStore.getState()
    let newComments = 0

    myEntries.forEach((entry) => {
      const comments = getComments(entry.id)
      comments.forEach((c: any) => {
        if (c.userId !== user.id && new Date(c.createdAt).getTime() > lastCheck) {
          newComments++
        }
      })
    })

    if (newComments > 0) {
      setTimeout(() => {
        toast({
          title: `💬 ${newComments} new comment${newComments > 1 ? "s" : ""}`,
          description: "Someone commented on your entries!",
        })
      }, 3000)
    }
  }, [entries, currentSpaceId, user, toast])

  return null
}
