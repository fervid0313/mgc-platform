"use client"

import { useState } from "react"
import type React from "react"
import type { JournalEntry } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import { getAvatarUrl } from "@/lib/avatar-generator"
import { safeSubstring } from "@/lib/string-safety"
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Flame,
  AlertTriangle,
  Heart,
  Trash2,
  Edit3,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { EntryEditor } from "./entry-editor"

interface JournalEntryCardProps {
  entry: JournalEntry
  index: number
  isGlobal?: boolean
}

const tradeTypeColors: Record<string, string> = {
  "day-trade": "text-blue-400",
  swing: "text-amber-400",
  investment: "text-emerald-400",
  ecommerce: "text-pink-400",
  general: "text-primary",
}

const mentalStateConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  calm: { icon: <Brain className="h-3 w-3" />, color: "text-green-500 bg-green-500/10" },
  focused: { icon: <Target className="h-3 w-3" />, color: "text-blue-500 bg-blue-500/10" },
  aggressive: { icon: <Flame className="h-3 w-3" />, color: "text-red-500 bg-red-500/10" },
  fearful: { icon: <AlertTriangle className="h-3 w-3" />, color: "text-amber-500 bg-amber-500/10" },
}

export function JournalEntryCard({ entry, index, isGlobal = false }: JournalEntryCardProps) {
  const timeAgo = formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })
  const [showLightbox, setShowLightbox] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const {
    user,
    addLike,
    removeLike,
    hasLiked,
    getLikeCount,
    getProfile,
    isAdmin,
    deleteEntry,
  } = useAppStore()

  const liked = hasLiked(entry.id)
  const likeCount = getLikeCount(entry.id)
  const isOwnPost = user?.id === entry.userId
  const authorProfile = getProfile(entry.userId)
  const userIsAdmin = isAdmin()

  const handleLike = () => {
    if (liked) {
      removeLike(entry.id)
    } else {
      addLike(entry.id)
    }
  }

  const handleDelete = () => {
    if (userIsAdmin && confirm("Are you sure you want to delete this post?")) {
      deleteEntry(entry.id, entry.spaceId)
    }
  }

  return (
    <>
      <div
        className="glass rounded-3xl p-6 space-y-3 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 flex-wrap">
            {isGlobal && authorProfile && (
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img
                  src={getAvatarUrl(entry.username || "user", authorProfile?.avatar, 32)}
                  alt={entry.username || "Entry"}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
            )}
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">@{entry.username || "unknown"}</span>
            {entry.tradeType && entry.tradeType !== "general" && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${tradeTypeColors[entry.tradeType] || "text-muted-foreground"}`}
              >
                {entry.tradeType?.replace("-", " ") || entry.tradeType}
              </span>
            )}
            {entry.mentalState && (
              <span
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${mentalStateConfig[entry.mentalState].color}`}
              >
                {mentalStateConfig[entry.mentalState].icon}
                {entry.mentalState}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOwnPost && (
              <button
                onClick={() => setShowEditModal(true)}
                className="p-1 text-blue-500/60 hover:text-blue-500 transition-colors icon-glow"
                title="Edit post"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            {userIsAdmin && (
              <button
                onClick={handleDelete}
                className="p-1 text-red-500/60 hover:text-red-500 transition-colors icon-glow"
                title="Delete post (Admin)"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <span className="text-[10px] text-muted-foreground font-bold">{timeAgo}</span>
          </div>
        </div>

        {(entry.symbol || entry.strategy || entry.timeframe || entry.direction || entry.entryPrice !== undefined || entry.exitPrice !== undefined || entry.rMultiple !== undefined) && (
          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-muted-foreground">
            {entry.symbol && <span className="px-2 py-0.5 rounded-full bg-muted/50">{entry.symbol}</span>}
            {entry.direction && <span className="px-2 py-0.5 rounded-full bg-muted/50">{entry.direction.toUpperCase()}</span>}
            {entry.timeframe && <span className="px-2 py-0.5 rounded-full bg-muted/50">{entry.timeframe}</span>}
            {entry.strategy && <span className="px-2 py-0.5 rounded-full bg-muted/50">{entry.strategy}</span>}
            {entry.entryPrice !== undefined && <span className="px-2 py-0.5 rounded-full bg-muted/50">Entry {entry.entryPrice}</span>}
            {entry.exitPrice !== undefined && <span className="px-2 py-0.5 rounded-full bg-muted/50">Exit {entry.exitPrice}</span>}
            {entry.rMultiple !== undefined && <span className="px-2 py-0.5 rounded-full bg-muted/50">{entry.rMultiple}R</span>}
          </div>
        )}

        <p className="text-sm text-foreground/80 leading-relaxed font-medium">{entry.content}</p>

        {/* Debug: Check if image exists */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            Debug: {(() => {
              try {
                return entry.image && typeof entry.image === 'string' ? 'Image exists: ' + safeSubstring(entry.image, 0, 50) + '...' : 'No image'
              } catch (e) {
                return 'No image'
              }
            })()}
          </div>
        )}

        {entry.image && (
          <div
            className="relative rounded-xl overflow-hidden border border-border cursor-pointer hover:border-primary/50 transition-all duration-300 group"
            onClick={() => setShowLightbox(true)}
          >
            <div className="relative aspect-video bg-gradient-to-br from-muted/20 to-muted/10">
              <Image
                src={entry.image}
                alt="Trade proof"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"
                style={{
                  position: 'absolute',
                  height: '100%',
                  width: '100%',
                  left: 0,
                  top: 0,
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0h-3" />
              </svg>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <span className="text-[10px] font-medium text-white">Click to expand</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {entry.profitLoss !== undefined && (
            <div
              className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg ${
                entry.profitLoss >= 0 
                  ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {entry.profitLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-mono">
                {entry.profitLoss >= 0 ? "+" : ""}${Math.abs(entry.profitLoss).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {isGlobal && (
          <div className="flex items-center gap-4 pt-3 border-t border-border">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-bold transition-colors icon-glow ${
                liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              <span>{likeCount}</span>
            </button>
          </div>
        )}
      </div>

      {showLightbox && entry.image && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-6xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-1">
              <Image
                src={entry.image}
                alt="Trade proof - full size"
                width={1200}
                height={800}
                className="max-h-[90vh] w-auto object-contain rounded-xl"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                priority
              />
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setShowLightbox(false)}
                className="bg-black/50 backdrop-blur-sm text-white/80 hover:text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
                title="Close (ESC)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(entry.image, '_blank')
                }}
                className="bg-black/50 backdrop-blur-sm text-white/80 hover:text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
                title="Open in new tab"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6V4a2 2 0 00-2-2h-6m6 0V10a2 2 0 002 2h-2m-2-6h4" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-xs text-white/80">Press ESC to close • Click outside to dismiss</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EntryEditor
        entry={entry}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  )
}
