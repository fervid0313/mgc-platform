"use client"

import type React from "react"
import type { JournalEntry } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Flame,
  AlertTriangle,
  Heart,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { useState } from "react"

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
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")

  const {
    user,
    addLike,
    removeLike,
    hasLiked,
    getLikeCount,
    getComments,
    addComment,
    getProfile,
    isAdmin,
    deleteEntry,
  } = useAppStore()

  const liked = hasLiked(entry.id)
  const likeCount = getLikeCount(entry.id)
  const comments = getComments(entry.id)
  const isOwnPost = user?.id === entry.userId
  const authorProfile = getProfile(entry.userId)
  const userIsAdmin = isAdmin()

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment && newComment.trim()) {
      addComment(entry.id, newComment)
      setNewComment("")
    }
  }

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
              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                {authorProfile.avatar ? (
                  <Image
                    src={authorProfile.avatar || "/placeholder.svg"}
                    alt={entry.username}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {entry.username ? entry.username.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </div>
            )}
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">@{entry.username}</span>
            {entry.tradeType && entry.tradeType !== "general" && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${tradeTypeColors[entry.tradeType] || "text-muted-foreground"}`}
              >
                {entry.tradeType ? entry.tradeType.replace("-", " ") : entry.tradeType}
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

        <p className="text-sm text-foreground/80 leading-relaxed font-medium">{entry.content}</p>

        {entry.image && (
          <div
            className="relative rounded-xl overflow-hidden border border-border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setShowLightbox(true)}
          >
            <Image
              src={entry.image || "/placeholder.svg"}
              alt="Trade proof"
              width={400}
              height={300}
              className="max-h-64 w-full object-contain bg-black/20"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="text-[10px] font-bold text-white/0 hover:text-white/80 uppercase tracking-widest">
                Click to expand
              </span>
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
              className={`flex items-center gap-1 text-sm font-bold ${entry.profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {entry.profitLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>
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

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors icon-glow"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{comments.length}</span>
            </button>

          </div>
        )}

        {isGlobal && showComments && (
          <div className="pt-3 space-y-3">
            {comments.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 text-xs">
                    <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                      {comment.avatar ? (
                        <Image
                          src={comment.avatar || "/placeholder.svg"}
                          alt={comment.username}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {comment.username ? comment.username.charAt(0).toUpperCase() : "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-primary">@{comment.username}</span>
                      <span className="text-muted-foreground ml-2">{comment.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!newComment || !newComment.trim()}
                className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed icon-glow"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {showLightbox && entry.image && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Image
              src={entry.image || "/placeholder.svg"}
              alt="Trade proof - full size"
              width={1200}
              height={800}
              className="max-h-[90vh] w-auto object-contain rounded-xl"
            />
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/50 rounded-full p-2 transition-colors icon-glow"
            >
              <span className="text-xs font-bold">ESC</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
