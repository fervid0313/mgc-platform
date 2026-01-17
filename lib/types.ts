export interface User {
  id: string
  username: string
  tag: string
  email: string
  avatar?: string
  isAdmin?: boolean
  createdAt: Date
}

export interface Space {
  id: string
  name: string
  description?: string
  ownerId: string
  isPrivate: boolean
  createdAt: Date
  memberCount: number
}

export interface SpaceMember {
  id: string
  spaceId: string
  userId: string
  role: "owner" | "admin" | "member"
  joinedAt: Date
}

export interface JournalEntry {
  id: string
  spaceId: string
  userId: string
  username: string
  content: string
  tags: string[]
  tradeType?: "day-trade" | "swing" | "investment" | "ecommerce" | "general"
  profitLoss?: number
  image?: string
  mentalState?: MentalState
  createdAt: Date
}

export type MentalState = "calm" | "focused" | "aggressive" | "fearful"

export type Theme = "monochrome"

export interface MilestoneLevel {
  level: number
  name: string
  requiredWins: number
  badge: string
}

export const MILESTONE_LEVELS: MilestoneLevel[] = [
  { level: 1, name: "Starter", requiredWins: 0, badge: "🌱" },
  { level: 2, name: "Rising", requiredWins: 10, badge: "📈" },
  { level: 3, name: "Consistent", requiredWins: 25, badge: "💜" },
  { level: 4, name: "Dedicated", requiredWins: 50, badge: "💚" },
  { level: 5, name: "Skilled", requiredWins: 75, badge: "🔥" },
  { level: 6, name: "Elite", requiredWins: 100, badge: "🏆" },
  { level: 7, name: "Master", requiredWins: 150, badge: "💙" },
  { level: 8, name: "Champion", requiredWins: 200, badge: "⚡" },
  { level: 9, name: "Diamond", requiredWins: 250, badge: "💎" },
  { level: 10, name: "Mythic", requiredWins: 350, badge: "🌙" },
  { level: 11, name: "Platinum", requiredWins: 400, badge: "🪙" },
  { level: 12, name: "Legendary", requiredWins: 500, badge: "👑" },
]

export interface ChatMessage {
  id: string
  spaceId: string
  userId: string
  username: string
  content: string
  createdAt: Date
}

export interface DirectMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: Date
  senderUsername?: string
  receiverUsername?: string
}

export interface UserProfile {
  id: string
  username: string
  tag: string
  email: string
  avatar?: string
  bio?: string
  tradingStyle?: "day-trader" | "swing-trader" | "investor" | "ecommerce"
  winRate?: number
  totalTrades?: number
  socialLinks?: {
    twitter?: string
    discord?: string
    instagram?: string
    telegram?: string
    youtube?: string
  }
  isOnline?: boolean
  createdAt: Date
}

export interface FriendRequest {
  id: string
  fromUserId: string
  fromUsername: string
  fromTag: string
  toUserId: string
  toUsername: string
  toTag: string
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
}

export interface Comment {
  id: string
  entryId: string
  userId: string
  username: string
  avatar?: string
  content: string
  createdAt: Date
}

export interface Like {
  id: string
  entryId: string
  userId: string
  createdAt: Date
}

export interface Invitation {
  id: string
  spaceId: string
  inviterId: string
  inviteeEmail: string
  status: "pending" | "accepted" | "declined"
  createdAt: Date
}

// Helper functions for collective vibe calculation
export function calculateCollectiveVibe(entries: JournalEntry[]): MentalState | null {
  const recentEntries = entries.slice(0, 10).filter((e) => e.mentalState)
  if (recentEntries.length < 3) return null

  const counts: Record<MentalState, number> = {
    calm: 0,
    focused: 0,
    aggressive: 0,
    fearful: 0,
  }

  recentEntries.forEach((e) => {
    if (e.mentalState) counts[e.mentalState]++
  })

  const threshold = recentEntries.length * 0.4
  for (const [state, count] of Object.entries(counts)) {
    if (count >= threshold) return state as MentalState
  }

  return null
}

// Get CSS theme class based on vibe
export function getVibeTheme(vibe: MentalState | null): string | null {
  if (!vibe) return null
  const themes: Record<MentalState, string> = {
    calm: "vibe-calm",
    focused: "vibe-focused",
    aggressive: "vibe-aggressive",
    fearful: "vibe-fearful",
  }
  return themes[vibe]
}

// Calculate space statistics
export function calculateSpaceStats(entries: JournalEntry[]): {
  totalWins: number
  totalEntries: number
  totalPnL: number
} {
  const totalEntries = entries.length
  const totalWins = entries.filter((e) => e.profitLoss && e.profitLoss > 0).length
  const totalPnL = entries.reduce((sum, e) => sum + (e.profitLoss || 0), 0)
  return { totalWins, totalEntries, totalPnL }
}

// Get current milestone level based on wins
export function getMilestoneLevel(wins: number): MilestoneLevel {
  for (let i = MILESTONE_LEVELS.length - 1; i >= 0; i--) {
    if (wins >= MILESTONE_LEVELS[i].requiredWins) {
      return MILESTONE_LEVELS[i]
    }
  }
  return MILESTONE_LEVELS[0]
}

// Get next milestone level
export function getNextMilestone(wins: number): MilestoneLevel | null {
  const currentLevel = getMilestoneLevel(wins)
  const nextIndex = MILESTONE_LEVELS.findIndex((m) => m.level === currentLevel.level) + 1
  return nextIndex < MILESTONE_LEVELS.length ? MILESTONE_LEVELS[nextIndex] : null
}

// Get list of unlocked themes based on wins
export function getUnlockedThemes(wins: number): Theme[] {
  return ["monochrome"]
}
