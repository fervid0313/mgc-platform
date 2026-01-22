import type { Space, JournalEntry, Invitation, UserProfile, Like } from "./types"

export const mockSpaces: Space[] = [
  {
    id: "space-global",
    name: "Global Feed",
    description: "Share your trading journey with the community",
    isPrivate: false,
    memberCount: 0,
    ownerId: "system",
    createdAt: new Date(),
  },
]

export const mockEntries: Record<string, JournalEntry[]> = {
  "space-global": [],
}

export const mockInvitations: Invitation[] = []

export const mockProfiles: UserProfile[] = []

export const mockLikes: Record<string, Like[]> = {}
