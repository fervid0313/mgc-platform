"use client"

import { create } from "zustand"
import type {
  User,
  Space,
  JournalEntry,
  Theme,
  MentalState,
  MilestoneLevel,
  ChatMessage,
  UserProfile,
  FriendRequest,
  Comment,
  Like,
  DirectMessage,
} from "./types"
import {
  calculateCollectiveVibe,
  getVibeTheme,
  calculateSpaceStats,
  getMilestoneLevel,
  getNextMilestone,
  getUnlockedThemes,
} from "./types"
import { createClient } from "@/lib/supabase/client"

const ADMIN_EMAIL = "fervid2023@gmail.com"

const globalFeedSpace: Space = {
  id: "space-global",
  name: "Global Feed",
  description: "Public space for the entire MGS community",
  ownerId: "system",
  isPrivate: false,
  createdAt: new Date(),
  memberCount: 9999,
}

function generateTag(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: () => boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, username: string) => Promise<boolean>
  logout: () => void
  initializeAuth: () => Promise<void>

  // Spaces
  spaces: Space[]
  currentSpaceId: string | null
  setCurrentSpace: (spaceId: string) => void
  createSpace: (name: string, description?: string, isPrivate?: boolean) => void
  leaveSpace: (spaceId: string) => void

  // Entries
  entries: Record<string, JournalEntry[]>
  addEntry: (
    content: string,
    tags?: string[],
    tradeType?: JournalEntry["tradeType"],
    profitLoss?: number,
    image?: string,
    mentalState?: MentalState,
  ) => void
  deleteEntry: (entryId: string, spaceId: string) => void
  loadEntries: (spaceId: string) => Promise<void>

  getCollectiveVibe: () => MentalState | null
  getVibeThemeClass: () => string | null

  // UI
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void

  // Milestone state
  getSpaceStats: () => { totalWins: number; totalEntries: number; totalPnL: number }
  getCurrentLevel: () => MilestoneLevel
  getNextLevel: () => MilestoneLevel | null
  getUnlockedThemes: () => Theme[]

  chatMessages: Record<string, ChatMessage[]>
  sendMessage: (content: string) => void
  loadChatMessages: (spaceId: string) => Promise<void>

  profiles: UserProfile[]
  connections: string[]
  loadProfiles: () => Promise<void>
  loadConnections: () => Promise<void>

  friendRequests: FriendRequest[]
  sendFriendRequest: (usernameWithTag: string) => Promise<{ success: boolean; error?: string }>
  acceptFriendRequest: (requestId: string) => Promise<void>
  rejectFriendRequest: (requestId: string) => Promise<void>
  removeFriend: (friendId: string) => Promise<void>

  // Direct Messages
  sendDirectMessage: (friendId: string, content: string) => Promise<void>
  loadDirectMessages: (friendId: string) => Promise<void>
  directMessages: Record<string, DirectMessage[]>

  // Space Members
  getSpaceMembers: (spaceId: string) => UserProfile[]
  loadFriendRequests: () => Promise<void>
  getIncomingRequests: () => FriendRequest[]
  getOutgoingRequests: () => FriendRequest[]

  getProfile: (userId: string) => UserProfile | undefined
  findUserByTag: (usernameWithTag: string) => Promise<UserProfile | undefined>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  adminUpdateUserProfile: (userId: string, updates: Partial<UserProfile>) => void

  viewMode: "journal" | "chat"
  setViewMode: (mode: "journal" | "chat") => void

  // Comments and Likes
  comments: Record<string, Comment[]>
  likes: Record<string, Like[]>
  addComment: (entryId: string, content: string) => void
  toggleLike: (entryId: string) => void
  hasLiked: (entryId: string) => boolean
  getLikeCount: (entryId: string) => number
  getComments: (entryId: string) => Comment[]
  loadCommentsAndLikes: (spaceId: string) => Promise<void>
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  isLoading: true,

  isAdmin: () => {
    const { user } = get()
    return user?.isAdmin === true
  },

  initializeAuth: async () => {
    const supabase = createClient()

    // Load initial session
    const loadSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Fetch profile from database
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          if (profile) {
            const user: User = {
              id: profile.id,
              username: profile.username,
              tag: profile.tag,
              email: profile.email,
              avatar: profile.avatar,
              isAdmin: profile.email === ADMIN_EMAIL,
              createdAt: new Date(profile.created_at),
            }

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              spaces: [globalFeedSpace],
              currentSpaceId: "space-global",
            })

            // Load user's spaces
            const { data: spaces } = await supabase
              .from("spaces")
              .select("*")
              .or(`owner_id.eq.${session.user.id},is_private.eq.false`)

            if (spaces) {
              // Filter out any database Global Feed spaces to avoid duplicates
              const filteredSpaces = spaces.filter((s: any) => s.name !== 'Global Feed')
              const mappedSpaces = filteredSpaces.map((s: any) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                ownerId: s.owner_id,
                isPrivate: s.is_private,
                createdAt: new Date(s.created_at),
                memberCount: s.member_count || 1,
              }))
              set({ spaces: [globalFeedSpace, ...mappedSpaces] })
            }

            // Load friend requests
            get().loadFriendRequests()
            get().loadConnections()
            get().loadProfiles()

            return true
          }
        }
      } catch (error) {
        console.error("[v0] Auth initialization error:", error)
      }
      return false
    }

    // Load initial session
    const hasSession = await loadSession()
    if (!hasSession) {
      set({ isLoading: false })
    }

    // Set up auth state change listener to keep session in sync
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          // Fetch profile from database
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          if (profile) {
            const user: User = {
              id: profile.id,
              username: profile.username,
              tag: profile.tag,
              email: profile.email,
              avatar: profile.avatar,
              isAdmin: profile.email === ADMIN_EMAIL,
              createdAt: new Date(profile.created_at),
            }

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            })

            // Reload data
            get().loadFriendRequests()
            get().loadConnections()
            get().loadProfiles()
          }
        }
      } else if (event === "SIGNED_OUT") {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          spaces: [globalFeedSpace],
          currentSpaceId: "space-global",
        })
      }
    })
  },

  login: async (email: string, password: string) => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("[v0] Login error:", error)
        return false
      }

      if (data.user) {
        // Fetch profile
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

        if (profile) {
          const user: User = {
            id: profile.id,
            username: profile.username,
            tag: profile.tag,
            email: profile.email,
            avatar: profile.avatar,
            isAdmin: profile.email === ADMIN_EMAIL,
            createdAt: new Date(profile.created_at),
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            spaces: [globalFeedSpace],
            currentSpaceId: "space-global",
            connections: [],
          })

          // Load data
          get().loadFriendRequests()
          get().loadConnections()
          get().loadProfiles()

          return true
        }
      }

      return false
    } catch (error) {
      console.error("[v0] Login error:", error)
      return false
    }
  },

  signup: async (email: string, password: string, username: string) => {
    const supabase = createClient()

    if (!email || !password || !username) {
      return false
    }

    try {
      const tag = generateTag()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          data: {
            username,
            tag,
          },
        },
      })

      if (error) {
        console.error("[v0] Signup error:", error)
        return false
      }

      if (data.user) {
        // Create profile in database with better error handling
        let profileCreated = false
        try {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            username,
            tag,
            email,
            bio: "",
            created_at: new Date().toISOString(),
          })

          if (profileError) {
            console.error("[v0] Profile creation error:", profileError)

            // If it's a duplicate key error, the profile might already exist
            if (profileError.code === '23505') { // unique_violation
              console.log("[v0] Profile already exists, continuing...")
              profileCreated = true // Consider it successful
            } else {
              console.error("[v0] Profile creation failed with error:", profileError.message)
              // Don't return false here - let the user continue with auth even if profile fails
            }
          } else {
            console.log("[v0] Profile created successfully")
            profileCreated = true
          }
        } catch (error) {
          console.error("[v0] Profile creation exception:", error)
          // Continue anyway - auth user exists even if profile creation fails
        }

        // Wait a bit for the session to be fully established
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Get the refreshed session to ensure it's persisted
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData?.session) {
          const user: User = {
            id: data.user.id,
            username,
            tag,
            email,
            isAdmin: email === ADMIN_EMAIL,
            createdAt: new Date(),
          }

          const newProfile: UserProfile = {
            id: user.id,
            username,
            tag,
            email,
            bio: "",
            tradingStyle: undefined,
            winRate: 0,
            totalTrades: 0,
            socialLinks: {},
            isOnline: true,
            createdAt: new Date(),
          }

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          spaces: [globalFeedSpace], // New users start with only Global Feed
          currentSpaceId: "space-global",
          connections: [],
          profiles: [newProfile],
        })

          // Load data
          get().loadFriendRequests()
          get().loadConnections()
          get().loadProfiles()

          return true
        }
      }

      return false
    } catch (error) {
      console.error("[v0] Signup error:", error)
      return false
    }
  },

  logout: async () => {
    const { user } = get()

    const supabase = createClient()
    await supabase.auth.signOut()

    // Clear localStorage data for this user (all environments)
    if (user) {
      const env = process.env.NODE_ENV || 'development'
      localStorage.removeItem(`mgs_${env}_connections_${user.id}`)
      localStorage.removeItem(`mgs_${env}_connections_${user.id}_fresh`)
      // Also clear other environments to prevent conflicts
      localStorage.removeItem(`mgs_development_connections_${user.id}`)
      localStorage.removeItem(`mgs_development_connections_${user.id}_fresh`)
      localStorage.removeItem(`mgs_production_connections_${user.id}`)
      localStorage.removeItem(`mgs_production_connections_${user.id}_fresh`)
    }

    set({
      user: null,
      isAuthenticated: false,
      spaces: [globalFeedSpace],
      currentSpaceId: "space-global",
      connections: [],
      friendRequests: [],
    })
  },

  // Spaces
  spaces: [globalFeedSpace],
  currentSpaceId: "space-global",

  setCurrentSpace: (spaceId: string) => {
    set({ currentSpaceId: spaceId, sidebarOpen: false, viewMode: "journal" })
    get().loadEntries(spaceId)
    get().loadCommentsAndLikes(spaceId)
    get().loadChatMessages(spaceId)
  },

  createSpace: async (name: string, description?: string, isPrivate = false) => {
    const { spaces, user } = get()
    if (!user) return

    const supabase = createClient()

    const { data, error } = await supabase
      .from("spaces")
      .insert({
        name,
        description,
        owner_id: user.id,
        is_private: isPrivate,
        member_count: 1,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Create space error:", error)
      return
    }

    const newSpace: Space = {
      id: data.id,
      name: data.name,
      description: data.description,
      ownerId: data.owner_id,
      isPrivate: data.is_private,
      createdAt: new Date(data.created_at),
      memberCount: 1,
    }

    set({
      spaces: [...spaces, newSpace],
      currentSpaceId: newSpace.id,
      sidebarOpen: false,
    })
  },

  leaveSpace: async (spaceId: string) => {
    const { spaces, user, currentSpaceId } = get()
    if (!user) return

    // Don't allow leaving the global feed
    if (spaceId === "space-global") return

    const supabase = createClient()

    // If this is a public group that the user joined, delete the space membership
    // For user-created spaces, we don't actually delete them, just remove from their view
    const spaceToLeave = spaces.find(s => s.id === spaceId)
    if (!spaceToLeave) return

    // For user-created private spaces, just remove from their spaces list
    // For public groups, they can "leave" by removing from their view
    let newSpaces = spaces.filter(s => s.id !== spaceId)
    let newCurrentSpaceId = currentSpaceId

    // If they were in the space they're leaving, switch to global feed
    if (currentSpaceId === spaceId) {
      newCurrentSpaceId = "space-global"
    }

    set({
      spaces: newSpaces,
      currentSpaceId: newCurrentSpaceId,
      sidebarOpen: false,
    })

    // Clear any cached data for this space
    set((state) => ({
      entries: Object.fromEntries(
        Object.entries(state.entries).filter(([key]) => key !== spaceId)
      ),
      chatMessages: Object.fromEntries(
        Object.entries(state.chatMessages).filter(([key]) => key !== spaceId)
      ),
      comments: Object.fromEntries(
        Object.entries(state.comments).filter(([key]) => key !== spaceId)
      ),
      likes: Object.fromEntries(
        Object.entries(state.likes).filter(([key]) => key !== spaceId)
      ),
    }))
  },

  entries: { "space-global": [] },

  loadEntries: async (spaceId: string) => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Load entries error:", error)
      return
    }

    const entries = data.map((e: any) => ({
      id: e.id,
      spaceId: e.space_id,
      userId: e.user_id,
      username: e.username,
      content: e.content,
      tags: e.tags || [],
      tradeType: e.trade_type,
      profitLoss: e.profit_loss,
      image: e.image,
      mentalState: e.mental_state,
      createdAt: new Date(e.created_at),
    }))

    set((state) => ({
      entries: { ...state.entries, [spaceId]: entries },
    }))
  },

  addEntry: async (
    content: string,
    tags: string[] = [],
    tradeType?: JournalEntry["tradeType"],
    profitLoss?: number,
    image?: string,
    mentalState?: MentalState,
  ) => {
    const { currentSpaceId, user, entries } = get()
    if (!currentSpaceId || !user) return

    const supabase = createClient()

    const { data, error } = await supabase
      .from("entries")
      .insert({
        space_id: currentSpaceId,
        user_id: user.id,
        username: user.username,
        content,
        tags,
        trade_type: tradeType,
        profit_loss: profitLoss,
        image,
        mental_state: mentalState,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Add entry error:", error)
      return
    }

    const newEntry: JournalEntry = {
      id: data.id,
      spaceId: data.space_id,
      userId: data.user_id,
      username: data.username,
      content: data.content,
      tags: data.tags || [],
      tradeType: data.trade_type,
      profitLoss: data.profit_loss,
      image: data.image,
      mentalState: data.mental_state,
      createdAt: new Date(data.created_at),
    }

    const spaceEntries = entries[currentSpaceId] || []
    set({
      entries: {
        ...entries,
        [currentSpaceId]: [newEntry, ...spaceEntries],
      },
    })
  },

  deleteEntry: async (entryId: string, spaceId: string) => {
    const { entries, isAdmin } = get()
    if (!isAdmin()) return

    const supabase = createClient()

    const { error } = await supabase.from("entries").delete().eq("id", entryId)

    if (error) {
      console.error("[v0] Delete entry error:", error)
      return
    }

    const spaceEntries = entries[spaceId] || []
    set({
      entries: {
        ...entries,
        [spaceId]: spaceEntries.filter((e) => e.id !== entryId),
      },
    })
  },

  getCollectiveVibe: () => {
    const { currentSpaceId, entries } = get()
    if (!currentSpaceId) return null
    const spaceEntries = entries[currentSpaceId] || []
    return calculateCollectiveVibe(spaceEntries)
  },

  getVibeThemeClass: () => {
    const vibe = get().getCollectiveVibe()
    return getVibeTheme(vibe)
  },

  // UI
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  // Theme
  theme: "monochrome",
  setTheme: (theme: Theme) => {
    set({ theme })
    document.documentElement.setAttribute("data-theme", theme)
  },

  // Milestone getters
  getSpaceStats: () => {
    const { currentSpaceId, entries } = get()
    if (!currentSpaceId) return { totalWins: 0, totalEntries: 0, totalPnL: 0 }
    const spaceEntries = entries[currentSpaceId] || []
    return calculateSpaceStats(spaceEntries)
  },

  getCurrentLevel: () => {
    const stats = get().getSpaceStats()
    return getMilestoneLevel(stats.totalWins)
  },

  getNextLevel: () => {
    const stats = get().getSpaceStats()
    return getNextMilestone(stats.totalWins)
  },

  getUnlockedThemes: () => {
    const { user } = get()
    if (user?.isAdmin) {
      return ["monochrome"] as Theme[]
    }
    const stats = get().getSpaceStats()
    return getUnlockedThemes(stats.totalWins)
  },

  chatMessages: { "space-global": [] },

  loadChatMessages: async (spaceId: string) => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Load chat messages error:", error)
      return
    }

    const messages = data.map((m: any) => ({
      id: m.id,
      spaceId: m.space_id,
      userId: m.user_id,
      username: m.username,
      content: m.content,
      createdAt: new Date(m.created_at),
    }))

    set((state) => ({
      chatMessages: { ...state.chatMessages, [spaceId]: messages },
    }))
  },

  sendMessage: async (content: string) => {
    const { currentSpaceId, user, chatMessages } = get()
    if (!currentSpaceId || !user || !content.trim()) return

    const supabase = createClient()

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        space_id: currentSpaceId,
        user_id: user.id,
        username: user.username,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Send message error:", error)
      return
    }

    const newMessage: ChatMessage = {
      id: data.id,
      spaceId: data.space_id,
      userId: data.user_id,
      username: data.username,
      content: data.content,
      createdAt: new Date(data.created_at),
    }

    const spaceMessages = chatMessages[currentSpaceId] || []
    set({
      chatMessages: {
        ...chatMessages,
        [currentSpaceId]: [...spaceMessages, newMessage],
      },
    })
  },

  profiles: [],
  connections: [],
  friendRequests: [],

  loadProfiles: async () => {
    const supabase = createClient()

    const { data, error } = await supabase.from("profiles").select("*")

    if (error) {
      console.error("[v0] Load profiles error:", error)
      return
    }

    const profiles = data.map((p: any) => ({
      id: p.id,
      username: p.username,
      tag: p.tag,
      email: p.email,
      avatar: p.avatar,
      bio: p.bio,
      tradingStyle: p.trading_style,
      winRate: p.win_rate || 0,
      totalTrades: p.total_trades || 0,
      socialLinks: p.social_links || {},
      isOnline: false,
      createdAt: new Date(p.created_at),
    }))

    set({ profiles })
  },

  loadConnections: async () => {
    const { user } = get()
    if (!user) return

    // Environment-specific localStorage keys to prevent cross-environment conflicts
    const env = process.env.NODE_ENV || 'development'
    const cacheKey = `mgs_${env}_connections_${user.id}`
    const freshKey = `mgs_${env}_connections_${user.id}_fresh`

    // Check if we have a fresh localStorage update (from removeFriend/addFriend)
    const freshConnections = localStorage.getItem(freshKey)
    if (freshConnections) {
      try {
        const parsedConnections = JSON.parse(freshConnections)
        console.log(`[v0] Loading fresh connections from ${env} localStorage:`, parsedConnections)
        set({ connections: parsedConnections })
        // Clean up the fresh marker
        localStorage.removeItem(freshKey)
        return
      } catch (error) {
        console.warn("[v0] Failed to parse fresh connections:", error)
        localStorage.removeItem(freshKey)
      }
    }

    // First, try to load from localStorage for immediate UI update
    const cachedConnections = localStorage.getItem(cacheKey)
    if (cachedConnections) {
      try {
        const parsedConnections = JSON.parse(cachedConnections)
        set({ connections: parsedConnections })
      } catch (error) {
        console.warn("[v0] Failed to parse cached connections:", error)
      }
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    if (error) {
      console.error("[v0] Load connections error:", error)
      return
    }

    const connections = data.map((c: any) => (c.user_id === user.id ? c.friend_id : c.user_id))

    // Only update localStorage if we don't have a fresh version
    if (!freshConnections) {
      localStorage.setItem(cacheKey, JSON.stringify(connections))
    }

    set({ connections })
  },

  loadFriendRequests: async () => {
    const { user } = get()
    if (!user) return

    const supabase = createClient()

    const { data, error } = await supabase
      .from("friend_requests")
      .select("*")
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .eq("status", "pending")

    if (error) {
      console.error("[v0] Load friend requests error:", error)
      return
    }

    const requests = data.map((r: any) => ({
      id: r.id,
      fromUserId: r.from_user_id,
      fromUsername: r.from_username,
      fromTag: r.from_tag,
      toUserId: r.to_user_id,
      toUsername: r.to_username,
      toTag: r.to_tag,
      status: r.status,
      createdAt: new Date(r.created_at),
    }))

    set({ friendRequests: requests })
  },

  findUserByTag: async (usernameWithTag: string) => {
    const match = usernameWithTag.trim().match(/^(.+)#(\d{4})$/)
    if (!match) {
      return undefined
    }
    const [, username, tag] = match

    const supabase = createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", username)
      .eq("tag", tag)
      .single()

    if (error || !data) {
      return undefined
    }

    return {
      id: data.id,
      username: data.username,
      tag: data.tag,
      email: data.email,
      avatar: data.avatar,
      bio: data.bio,
      tradingStyle: data.trading_style,
      winRate: data.win_rate || 0,
      totalTrades: data.total_trades || 0,
      socialLinks: data.social_links || {},
      isOnline: false,
      createdAt: new Date(data.created_at),
    }
  },

  getProfile: (userId: string) => {
    return get().profiles.find((p) => p.id === userId)
  },

  sendFriendRequest: async (usernameWithTag: string) => {
    const { user, connections, friendRequests, findUserByTag } = get()
    if (!user) return { success: false, error: "Not logged in" }

    const targetProfile = await findUserByTag(usernameWithTag)
    if (!targetProfile) return { success: false, error: "User not found" }
    if (targetProfile.id === user.id) return { success: false, error: "Cannot add yourself" }
    if (connections.includes(targetProfile.id)) return { success: false, error: "Already friends" }

    const existingRequest = friendRequests.find(
      (r) =>
        (r.fromUserId === user.id && r.toUserId === targetProfile.id) ||
        (r.fromUserId === targetProfile.id && r.toUserId === user.id),
    )
    if (existingRequest) return { success: false, error: "Request already exists" }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("friend_requests")
      .insert({
        from_user_id: user.id,
        from_username: user.username,
        from_tag: user.tag,
        to_user_id: targetProfile.id,
        to_username: targetProfile.username,
        to_tag: targetProfile.tag,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Send friend request error:", error)
      return { success: false, error: "Failed to send request" }
    }

    const newRequest: FriendRequest = {
      id: data.id,
      fromUserId: data.from_user_id,
      fromUsername: data.from_username,
      fromTag: data.from_tag,
      toUserId: data.to_user_id,
      toUsername: data.to_username,
      toTag: data.to_tag,
      status: "pending",
      createdAt: new Date(data.created_at),
    }

    set({ friendRequests: [...friendRequests, newRequest] })
    return { success: true }
  },

  acceptFriendRequest: async (requestId: string) => {
    const { user, friendRequests, connections } = get()
    if (!user) return

    const request = friendRequests.find((r) => r.id === requestId)
    if (!request) {
      console.error("[v0] Friend request not found:", requestId)
      return
    }

    console.log("[v0] Accepting friend request:", requestId, "from:", request.fromUsername)

    const supabase = createClient()

    try {
      // Update request status
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)

      if (updateError) {
        console.error("[v0] Failed to update friend request status:", updateError)
        return
      }

      // Create connection
      const { error: connectionError } = await supabase
        .from("connections")
        .insert({
          user_id: user.id,
          friend_id: request.fromUserId,
        })

      if (connectionError) {
        console.error("[v0] Failed to create connection:", connectionError)
        return
      }

      console.log("[v0] Database updates successful")

      // Update local state
      const updatedConnections = [...connections, request.fromUserId]
      const updatedFriendRequests = friendRequests.filter((r) => r.id !== requestId)

      // Environment-specific localStorage keys
      const env = process.env.NODE_ENV || 'development'
      const cacheKey = `mgs_${env}_connections_${user.id}`
      const freshKey = `mgs_${env}_connections_${user.id}_fresh`

      // Save to localStorage with fresh marker
      localStorage.setItem(cacheKey, JSON.stringify(updatedConnections))
      localStorage.setItem(freshKey, JSON.stringify(updatedConnections))

      set({
        connections: updatedConnections,
        friendRequests: updatedFriendRequests,
      })

      console.log("[v0] Friend request accepted successfully")
      console.log("[v0] Remaining friend requests:", updatedFriendRequests.length)

    } catch (error) {
      console.error("[v0] Error accepting friend request:", error)
    }
  },

  rejectFriendRequest: async (requestId: string) => {
    const { friendRequests } = get()

    const request = friendRequests.find((r) => r.id === requestId)
    if (!request) {
      console.error("[v0] Friend request not found for rejection:", requestId)
      return
    }

    console.log("[v0] Rejecting friend request:", requestId, "from:", request.fromUsername)

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status: "rejected" })
        .eq("id", requestId)

      if (error) {
        console.error("[v0] Failed to reject friend request:", error)
        return
      }

      const updatedFriendRequests = friendRequests.filter((r) => r.id !== requestId)

      set({
        friendRequests: updatedFriendRequests,
      })

      console.log("[v0] Friend request rejected successfully")
      console.log("[v0] Remaining friend requests:", updatedFriendRequests.length)

    } catch (error) {
      console.error("[v0] Error rejecting friend request:", error)
    }
  },

  removeFriend: async (friendId: string) => {
    const { user, connections } = get()
    if (!user) return

    const supabase = createClient()

    // Remove the connection from database (works for both directions due to table structure)
    const { error } = await supabase
      .from("connections")
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

    if (error) {
      console.error("[v0] Remove friend error:", error)
      return
    }

    // Update local state
    const updatedConnections = connections.filter(id => id !== friendId)

    console.log("[v0] Updated connections after removal:", updatedConnections)

    // Environment-specific localStorage keys
    const env = process.env.NODE_ENV || 'development'
    const cacheKey = `mgs_${env}_connections_${user.id}`
    const freshKey = `mgs_${env}_connections_${user.id}_fresh`

    // Save to localStorage with fresh marker (takes precedence over database)
    localStorage.setItem(cacheKey, JSON.stringify(updatedConnections))
    localStorage.setItem(freshKey, JSON.stringify(updatedConnections))

    console.log(`[v0] Saved fresh connections to ${env} localStorage`)

    set({
      connections: updatedConnections
    })

    console.log("[v0] Friend removed successfully")
  },

  directMessages: {},

  sendDirectMessage: async (friendId: string, content: string) => {
    const { user, directMessages } = get()
    if (!user || !content.trim()) return

    const supabase = createClient()

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Send DM error:", error)
      return
    }

    const newMessage: DirectMessage = {
      id: data.id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      content: data.content,
      createdAt: new Date(data.created_at),
    }

    // Add to local state
    const conversationKey = [user.id, friendId].sort().join('-')
    const existingMessages = directMessages[conversationKey] || []

    set({
      directMessages: {
        ...directMessages,
        [conversationKey]: [...existingMessages, newMessage]
      }
    })
  },

  loadDirectMessages: async (friendId: string) => {
    const { user, directMessages } = get()
    if (!user) return

    const supabase = createClient()

    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Load DMs error:", error)
      return
    }

    const messages = data.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      content: msg.content,
      createdAt: new Date(msg.created_at),
    }))

    const conversationKey = [user.id, friendId].sort().join('-')

    set({
      directMessages: {
        ...directMessages,
        [conversationKey]: messages
      }
    })
  },

  getSpaceMembers: (spaceId: string) => {
    const { profiles, user, spaces } = get()
    const space = spaces.find(s => s.id === spaceId)

    if (!space) return []

    // For now, return all profiles since space membership tracking needs improvement
    // In the future, this should check actual space membership
    // For Global Feed, show all users
    // For public groups, show users who have joined
    // For private spaces, show only invited members

    if (spaceId === "space-global") {
      return profiles.filter(p => p.id !== user?.id)
    }

    // For other spaces, return a subset (this is a placeholder implementation)
    // TODO: Implement proper space membership tracking
    return profiles.filter(p => p.id !== user?.id).slice(0, Math.min(5, profiles.length - 1))
  },

  getIncomingRequests: () => {
    const { user, friendRequests } = get()
    if (!user) return []
    return friendRequests.filter((r) => r.toUserId === user.id && r.status === "pending")
  },

  getOutgoingRequests: () => {
    const { user, friendRequests } = get()
    if (!user) return []
    return friendRequests.filter((r) => r.fromUserId === user.id && r.status === "pending")
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { user, profiles } = get()
    if (!user) return

    const supabase = createClient()

    const dbUpdates: any = {}
    if (updates.username) dbUpdates.username = updates.username
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio
    if (updates.avatar) dbUpdates.avatar = updates.avatar
    if (updates.tradingStyle) dbUpdates.trading_style = updates.tradingStyle
    if (updates.socialLinks) dbUpdates.social_links = updates.socialLinks

    const { error } = await supabase.from("profiles").update(dbUpdates).eq("id", user.id)

    if (error) {
      console.error("[v0] Update profile error:", error)
      return
    }

    const updatedProfiles = profiles.map((p) => (p.id === user.id ? { ...p, ...updates } : p))

    const updatedUser = { ...user }
    if (updates.username) updatedUser.username = updates.username
    if (updates.avatar) updatedUser.avatar = updates.avatar

    set({
      profiles: updatedProfiles,
      user: updatedUser,
    })
  },

  adminUpdateUserProfile: (userId: string, updates: Partial<UserProfile>) => {
    const { profiles, isAdmin } = get()
    if (!isAdmin()) return

    const updatedProfiles = profiles.map((p) => (p.id === userId ? { ...p, ...updates } : p))
    set({ profiles: updatedProfiles })
  },

  viewMode: "journal",
  setViewMode: (mode: "journal" | "chat") => set({ viewMode: mode }),

  comments: {},
  likes: {},

  loadCommentsAndLikes: async (spaceId: string) => {
    const { entries } = get()
    const spaceEntries = entries[spaceId] || []
    if (spaceEntries.length === 0) return

    const entryIds = spaceEntries.map((e) => e.id)
    const supabase = createClient()

    // Load comments
    const { data: commentsData } = await supabase.from("comments").select("*").in("entry_id", entryIds)

    // Load likes
    const { data: likesData } = await supabase.from("likes").select("*").in("entry_id", entryIds)

    const commentsMap: Record<string, Comment[]> = {}
    const likesMap: Record<string, Like[]> = {}

    commentsData?.forEach((c: any) => {
      if (!commentsMap[c.entry_id]) commentsMap[c.entry_id] = []
      commentsMap[c.entry_id].push({
        id: c.id,
        entryId: c.entry_id,
        userId: c.user_id,
        username: c.username,
        avatar: c.avatar,
        content: c.content,
        createdAt: new Date(c.created_at),
      })
    })

    likesData?.forEach((l: any) => {
      if (!likesMap[l.entry_id]) likesMap[l.entry_id] = []
      likesMap[l.entry_id].push({
        id: l.id,
        entryId: l.entry_id,
        userId: l.user_id,
        createdAt: new Date(l.created_at),
      })
    })

    set((state) => ({
      comments: { ...state.comments, ...commentsMap },
      likes: { ...state.likes, ...likesMap },
    }))
  },

  addComment: async (entryId: string, content: string) => {
    const { user, comments } = get()
    if (!user || !content.trim()) return

    const supabase = createClient()

    const { data, error } = await supabase
      .from("comments")
      .insert({
        entry_id: entryId,
        user_id: user.id,
        username: user.username,
        avatar: user.avatar,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Add comment error:", error)
      return
    }

    const newComment: Comment = {
      id: data.id,
      entryId: data.entry_id,
      userId: data.user_id,
      username: data.username,
      avatar: data.avatar,
      content: data.content,
      createdAt: new Date(data.created_at),
    }

    const entryComments = comments[entryId] || []
    set({
      comments: {
        ...comments,
        [entryId]: [...entryComments, newComment],
      },
    })
  },

  toggleLike: async (entryId: string) => {
    const { user, likes } = get()
    if (!user) return

    const supabase = createClient()
    const entryLikes = likes[entryId] || []
    const existingLike = entryLikes.find((l) => l.userId === user.id)

    if (existingLike) {
      await supabase.from("likes").delete().eq("id", existingLike.id)
      set({
        likes: {
          ...likes,
          [entryId]: entryLikes.filter((l) => l.id !== existingLike.id),
        },
      })
    } else {
      const { data, error } = await supabase
        .from("likes")
        .insert({
          entry_id: entryId,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Toggle like error:", error)
        return
      }

      const newLike: Like = {
        id: data.id,
        entryId: data.entry_id,
        userId: data.user_id,
        createdAt: new Date(data.created_at),
      }
      set({
        likes: {
          ...likes,
          [entryId]: [...entryLikes, newLike],
        },
      })
    }
  },

  hasLiked: (entryId: string) => {
    const { user, likes } = get()
    if (!user) return false
    const entryLikes = likes[entryId] || []
    return entryLikes.some((l) => l.userId === user.id)
  },

  getLikeCount: (entryId: string) => {
    const { likes } = get()
    return (likes[entryId] || []).length
  },

  getComments: (entryId: string) => {
    const { comments } = get()
    return comments[entryId] || []
  },
}))
