"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "mgc-bookmarks"

function getBookmarks(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

function setBookmarks(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function useBookmarks() {
  const [bookmarked, setBookmarked] = useState<string[]>([])

  useEffect(() => {
    setBookmarked(getBookmarks())
  }, [])

  const toggle = (entryId: string) => {
    setBookmarked((prev) => {
      const next = prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId]
      setBookmarks(next)
      return next
    })
  }

  const isBookmarked = (entryId: string) => bookmarked.includes(entryId)

  return { bookmarked, toggle, isBookmarked }
}
