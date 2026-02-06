"use client"

import { useState, useMemo } from "react"
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
  MessageCircle,
  Send,
  Pin,
  Bookmark,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { ConfirmDialog } from "./confirm-dialog"
import { ACHIEVEMENTS, calculateTraderStats } from "@/lib/achievements"
import { useBookmarks } from "./entry-bookmarks"
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
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [reactionRefresh, setReactionRefresh] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteCommentId, setShowDeleteCommentId] = useState<string | null>(null)

  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const { toast } = useToast()
  const { toggle: toggleBookmark, isBookmarked } = useBookmarks()

  const {
    user,
    addLike,
    removeLike,
    hasLiked,
    getLikeCount,
    getProfile,
    isAdmin,
    deleteEntry,
    addComment,
    deleteComment,
    togglePinEntry,
    getComments,
    getCommentCount,
    entries: storeEntries,
  } = useAppStore()

  const liked = hasLiked(entry.id)
  const likeCount = getLikeCount(entry.id)
  const commentCount = getCommentCount(entry.id)
  const comments = showComments ? getComments(entry.id) : []
  const isOwnPost = user?.id === entry.userId
  const authorProfile = getProfile(entry.userId)
  const userIsAdmin = isAdmin()

  const spaceEntryCount = (storeEntries[entry.spaceId] || []).length
  const badges = useMemo(() => {
    if (!authorProfile) return null
    const userEntries = storeEntries[entry.spaceId] || []
    const uEntries = userEntries.filter((e: any) => e.userId === entry.userId)
    if (uEntries.length < 1) return null
    const stats = calculateTraderStats(uEntries)
    const unlocked = ACHIEVEMENTS.filter((a: any) => a.check(stats))
    if (unlocked.length === 0) return null
    return unlocked.slice(0, 3).map((a: any) => (
      <span key={a.id} title={a.name} className="text-[10px]">{a.icon}</span>
    ))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.userId, entry.spaceId, spaceEntryCount])

  const handleComment = async () => {
    if (!commentText.trim()) return
    await addComment(entry.id, commentText)
    setCommentText("")
    toast({ title: "Comment added" })
  }

  const handleLike = () => {
    if (liked) {
      removeLike(entry.id)
    } else {
      addLike(entry.id)
      toast({ title: "Liked!" })
    }
  }

  const handleDelete = () => {
    if (userIsAdmin) setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteEntry(entry.id, entry.spaceId)
    setShowDeleteConfirm(false)
  }

  const handlePin = () => {
    togglePinEntry(entry.id, entry.spaceId)
    toast({ title: entry.pinned ? "Unpinned" : "Pinned to top" })
  }

  return (
    <>
      <div
        data-entry-id={entry.id}
        className={`glass-3d lift-3d press-3d rounded-3xl p-6 space-y-3 border animate-in fade-in slide-in-from-bottom-4 duration-500 transition-all ${entry.pinned ? 'border-primary/30 ring-1 ring-primary/10' : 'border-white/10'}`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex justify-between items-start">
          {entry.pinned && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase tracking-wider mb-1 w-full">
              <Pin className="h-3 w-3" />
              Pinned
            </div>
          )}
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
            {badges}
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
                onClick={handlePin}
                className={`p-1 transition-colors icon-glow ${entry.pinned ? 'text-primary' : 'text-muted-foreground/40 hover:text-primary'}`}
                title={entry.pinned ? "Unpin" : "Pin to top"}
              >
                <Pin className="h-4 w-4" />
              </button>
            )}
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
            <span className="text-[10px] text-muted-foreground font-bold">
              {timeAgo}
              {entry.updatedAt && new Date(entry.updatedAt).getTime() !== new Date(entry.createdAt).getTime() && (
                <span className="ml-1 text-muted-foreground/50" title={`Edited ${formatDistanceToNow(new Date(entry.updatedAt), { addSuffix: true })}`}>
                  (edited)
                </span>
              )}
            </span>
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

        <div className="text-sm text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap">
          {entry.content.split('\n').map((line, li) => (
            <span key={li}>
              {li > 0 && <br />}
              {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/).map((part, pi) => {
                if (part.startsWith('**') && part.endsWith('**')) return <strong key={pi}>{part.slice(2, -2)}</strong>
                if (part.startsWith('*') && part.endsWith('*')) return <em key={pi}>{part.slice(1, -1)}</em>
                if (part.startsWith('`') && part.endsWith('`')) return <code key={pi} className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>
                const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
                if (linkMatch) return <a key={pi} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{linkMatch[1]}</a>
                return part
              })}
            </span>
          ))}
        </div>

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

        {(() => {
          const allImages = entry.images?.length ? entry.images : entry.image ? [entry.image] : []
          if (allImages.length === 0) return null
          return (
            <div className={`grid gap-2 ${allImages.length === 1 ? 'grid-cols-1' : allImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
              {allImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-xl overflow-hidden border border-border cursor-pointer hover:border-primary/50 transition-all duration-300 group ${allImages.length === 3 && idx === 0 ? 'col-span-2' : ''}`}
                  onClick={() => { setLightboxIndex(idx); setShowLightbox(true) }}
                >
                  <div className={`relative ${allImages.length === 1 ? 'aspect-video' : 'aspect-square'} bg-gradient-to-br from-muted/20 to-muted/10`}>
                    <Image
                      src={img}
                      alt={`Trade proof ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {allImages.length > 1 && (
                    <div className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
                      <span className="text-[9px] font-bold text-white">{idx + 1}/{allImages.length}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })()}
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
          <div className="space-y-3">
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
              <div className="flex items-center gap-1">
                {["🔥", "💡", "📈", "💪", "🎯"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      const key = `mgc-reactions-${entry.id}`
                      const saved = JSON.parse(localStorage.getItem(key) || "{}")
                      const userId = user?.id || "anon"
                      if (saved[`${userId}-${emoji}`]) {
                        delete saved[`${userId}-${emoji}`]
                      } else {
                        saved[`${userId}-${emoji}`] = true
                      }
                      localStorage.setItem(key, JSON.stringify(saved))
                      setReactionRefresh((r) => r + 1)
                    }}
                    className={`text-sm px-1 py-0.5 rounded hover:bg-secondary/50 transition-colors ${
                      (() => {
                        const key = `mgc-reactions-${entry.id}`
                        const saved = JSON.parse(localStorage.getItem(key) || "{}")
                        return saved[`${user?.id || "anon"}-${emoji}`] ? "bg-primary/10 ring-1 ring-primary/30" : ""
                      })()
                    }`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  showComments ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{commentCount}</span>
              </button>
              <button
                onClick={() => { toggleBookmark(entry.id); toast({ title: isBookmarked(entry.id) ? "Removed bookmark" : "Bookmarked!" }) }}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  isBookmarked(entry.id) ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked(entry.id) ? "fill-current" : ""}`} />
              </button>
            </div>

            {showComments && (
              <div className="space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2 text-xs items-start group/comment">
                    <span className="font-bold text-foreground shrink-0">{c.username}</span>
                    <span className="text-muted-foreground flex-1">{c.content}</span>
                    {c.userId === user?.id && (
                      <button
                        onClick={() => { deleteComment(c.id); toast({ title: "Comment deleted" }) }}
                        className="opacity-0 group-hover/comment:opacity-100 text-muted-foreground hover:text-red-500 transition-all shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent border-b border-border text-xs py-1 outline-none placeholder:text-muted-foreground/50 focus:border-primary transition-colors"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="text-primary disabled:text-muted-foreground/30 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showLightbox && (() => {
        const allImages = entry.images?.length ? entry.images : entry.image ? [entry.image] : []
        if (allImages.length === 0) return null
        const currentImg = allImages[lightboxIndex] || allImages[0]
        return (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
            onClick={() => setShowLightbox(false)}
          >
            <div className="relative max-w-6xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-1">
                <Image
                  src={currentImg}
                  alt={`Trade proof ${lightboxIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-h-[90vh] w-auto object-contain rounded-xl"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                  priority
                />
              </div>
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white rounded-full p-3 hover:bg-black/70 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    onClick={() => setLightboxIndex((i) => (i + 1) % allImages.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white rounded-full p-3 hover:bg-black/70 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-xs font-bold text-white">{lightboxIndex + 1} / {allImages.length}</span>
                  </div>
                </>
              )}
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white/80 hover:text-white rounded-full p-3 transition-all duration-200 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )
      })()}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete this post?"
        description="This action cannot be undone. The entry and all associated data will be permanently removed."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Edit Modal */}
      <EntryEditor
        entry={entry}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  )
}
