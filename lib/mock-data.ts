import type { Space, JournalEntry, Invitation, UserProfile, Comment, Like } from "./types"

export const mockSpaces: Space[] = [
  {
    id: "space-global",
    name: "Global Feed",
    description: "Public space for the entire MGS community",
    ownerId: "system",
    isPrivate: false,
    createdAt: new Date(),
    memberCount: 9999,
  },
]

export const mockEntries: Record<string, JournalEntry[]> = {
  "space-global": [],
}

export const mockInvitations: Invitation[] = []

export const mockProfiles: UserProfile[] = []

export const mockComments: Record<string, Comment[]> = {}

export const mockLikes: Record<string, Like[]> = {}
