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
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
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

// Create the store
const store = create<AppState>()((set, get) => ({
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

            // Load user's spaces - with duplicate prevention
          const { data: spaces } = await supabase
            .from("spaces")
            .select("*")
            .or(`owner_id.eq.${session.user.id},is_private.eq.false`)

            console.log("[v0] Raw spaces from database:", spaces?.length || 0, spaces)

          if (spaces) {
              // Filter out any database Global Feed spaces to avoid duplicates
              const filteredSpaces = spaces.filter((s: any) => s.name !== 'Global Feed')
              console.log("[v0] After filtering Global Feed:", filteredSpaces.length, filteredSpaces.map(s => s.name))

              // Remove duplicates by ID (keep first occurrence)
              const seenIds = new Set()
              const deduplicatedSpaces = filteredSpaces.filter((space: any) => {
                if (seenIds.has(space.id)) {
                  console.log("[v0] Removing database duplicate:", space.name, space.id)
                  return false
                }
                seenIds.add(space.id)
                return true
              })

              console.log("[v0] After deduplication:", deduplicatedSpaces.length, deduplicatedSpaces.map(s => s.name))

              const mappedSpaces = deduplicatedSpaces.map((s: any) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              ownerId: s.owner_id,
              isPrivate: s.is_private,
              createdAt: new Date(s.created_at),
              memberCount: s.member_count || 1,
            }))

              const finalSpaces = [globalFeedSpace, ...mappedSpaces]
              console.log("[v0] Final spaces array:", finalSpaces.length, finalSpaces.map(s => s.name))

              set({ spaces: finalSpaces })
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

  resetPassword: async (email: string) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
      })

      if (error) {
        console.error("[v0] Password reset error:", error)
        return { success: false, error: error.message }
      }

      console.log("[v0] Password reset email sent successfully")
      return { success: true }

    } catch (error: any) {
      console.error("[v0] Password reset exception:", error)
      return { success: false, error: error.message || "Failed to send reset email" }
    }
  },

  logout: async () => {
    const { user } = get()

    const supabase = createClient()
    await supabase.auth.signOut()

    // Clear localStorage data for this user (all environments)
    if (user) {
      // Clear current environment
      const env = process.env.NODE_ENV || 'development'
      localStorage.removeItem(`mgs_${env}_connections_${user.id}`)

      // Also clear other environments to prevent conflicts
      localStorage.removeItem(`mgs_development_connections_${user.id}`)
      localStorage.removeItem(`mgs_production_connections_${user.id}`)
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

    // Prevent creating duplicate spaces
    const existingSpace = spaces.find(s => s.name === name)
    if (existingSpace) {
      console.log("[v0] Space with name already exists, switching to:", existingSpace.id)
      set({ currentSpaceId: existingSpace.id, sidebarOpen: false })
      return
    }

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
    // Skip database query for global feed - it doesn't have entries
    if (spaceId === "space-global") {
      console.log("[v0] Skipping entries load for global feed space")
      set((state) => ({
        entries: { ...state.entries, [spaceId]: [] },
      }))
      return
    }

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
    // Skip database query for global feed - it doesn't have chat messages
    if (spaceId === "space-global") {
      console.log("[v0] Skipping chat messages load for global feed space")
      set((state) => ({
        chatMessages: { ...state.chatMessages, [spaceId]: [] },
      }))
      return
    }

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

    // 🚨🚨🚨 CHECK GLOBAL FRIEND REMOVAL PROTECTION
    if (FRIEND_REMOVAL_IN_PROGRESS) {
      console.log("[v5] 🚨🚨🚨🚨🚨 GLOBAL PROTECTION ACTIVE - BLOCKING loadConnections during friend removal")
      return // ABSOLUTE BLOCK - no database loads during friend removal
    }

    // 🚨🚨🚨 CHECK FOR LOCKED CONNECTIONS STATE
    console.log("[v7] Checking for locked connections state...")
    console.log("[v7] FRIEND_REMOVAL_LOCKED_CONNECTIONS:", FRIEND_REMOVAL_LOCKED_CONNECTIONS)

    if (FRIEND_REMOVAL_LOCKED_CONNECTIONS !== null) {
      console.log("[v7] 🚨🚨🚨🚨🚨 LOCKED CONNECTIONS DETECTED - USING LOCKED STATE INSTEAD OF DATABASE")
      console.log("[v7] Locked connections:", FRIEND_REMOVAL_LOCKED_CONNECTIONS)
      console.log("[v7] Setting connections to locked state...")
      set({ connections: FRIEND_REMOVAL_LOCKED_CONNECTIONS })
      console.log("[v7] ✅ Locked connections applied to state")
      return // Use locked state - no database load allowed
    } else {
      console.log("[v7] No locked connections found, proceeding with database load")
    }

    // Database loads re-enabled - testing lock system

    // Environment-specific localStorage keys
    const env = process.env.NODE_ENV || 'development'
    const cacheKey = `mgs_${env}_connections_${user.id}`

    // 🚨🚨🚨 ABSOLUTE PRIORITY: Check for friend removal lock FIRST (blocks ALL database loads)
    const friendRemovalLockKey = `mgs_${env}_friend_removal_lock_${user.id}`
    console.log("[v3] Checking for friend removal lock:", friendRemovalLockKey)

    const removalLock = localStorage.getItem(friendRemovalLockKey)
    console.log("[v3] Lock data from localStorage:", removalLock)

    if (removalLock) {
      try {
        const lockData = JSON.parse(removalLock)
        console.log("[v3] Parsed lock data:", lockData)

        const lockAge = Date.now() - lockData.timestamp
        const isLockActive = lockAge < 120000 // 2 minutes
        console.log("[v3] Lock age:", lockAge, "ms, Is active:", isLockActive)

        if (isLockActive) {
          console.log("[v3] 🚨🚨🚨 FRIEND REMOVAL LOCK ACTIVE - BLOCKING ALL DATABASE LOADS")
          console.log("[v3] 🚨🚨🚨 Friend removed:", lockData.friendId, "Lock version:", lockData.lockVersion)
          console.log("[v3] 🚨🚨🚨 Using cached connections - friend will stay removed")

          // Use the cached data - this is ABSOLUTE PRIORITY
          const cachedData = localStorage.getItem(cacheKey)
          if (cachedData) {
            const parsed = JSON.parse(cachedData)
            console.log("[v3] 🚨🚨🚨 Setting connections from cache:", parsed.connections)
            set({ connections: parsed.connections })
          } else {
            console.warn("[v3] 🚨🚨🚨 No cached data found, but lock exists - using current state")
          }
          return // ABSOLUTE BLOCK - no database load allowed
        } else {
          console.log("[v3] Friend removal lock expired, clearing it")
          localStorage.removeItem(friendRemovalLockKey)
        }
      } catch (error) {
        console.warn("[v3] 🚨🚨🚨 Failed to parse removal lock, clearing it:", error)
        localStorage.removeItem(friendRemovalLockKey)
      }
    } else {
      console.log("[v3] No friend removal lock found - proceeding with normal logic")
    }

    // PRIORITY SYSTEM: Always check for recent local changes first (within last 2 minutes)
    const cachedData = localStorage.getItem(cacheKey)
    console.log("[v2] Checking for cached connections data:", cachedData ? "found" : "not found")

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        console.log("[v2] Parsed cached data:", parsed)

        // CRITICAL: If there's a recent local change (removal), ALWAYS use it
        // Reduced to 2 minutes to be more responsive but still handle slow operations
        const isRecentChange = parsed.isRecentChange && parsed.timestamp && (Date.now() - parsed.timestamp < 120000)
        console.log("[v2] Is recent change?", isRecentChange, "Timestamp:", parsed.timestamp, "Age:", Date.now() - parsed.timestamp)

        if (isRecentChange) {
          console.log("[v2] 🚨 PRIORITY OVERRIDE: Using recent local change instead of database:", parsed.connections)
          console.log("[v2] 🚨 This prevents friend reappearance after removal")
          set({ connections: parsed.connections })
          return
        } else if (parsed.isRecentChange === false) {
          console.log("[v2] Cached data is confirmed synced with database, safe to load fresh data")
        } else {
          console.log("[v2] Cached data timestamp expired, loading from database")
        }
      } catch (error) {
        console.warn("[v2] Failed to parse cached data:", error)
        // Clear corrupted cache
        localStorage.removeItem(cacheKey)
      }
    } else {
      console.log("[v2] No cached data found, loading from database")
    }

    // Load from database
    const supabase = createClient()

    try {
    const { data, error } = await supabase
      .from("connections")
      .select("*")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    if (error) {
      console.error("[v0] Load connections error:", error)
        // Fallback to cached data if database fails
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData)
            const connections = parsed.connections || parsed // Handle both old and new formats
            set({ connections: connections })
          } catch (cacheError) {
            console.warn("[v0] Failed to parse cached connections:", cacheError)
          }
        }
      return
    }

    const connections = data.map((c: any) => (c.user_id === user.id ? c.friend_id : c.user_id))

      console.log(`[v0] Loaded ${connections.length} connections from database:`, connections)

      // Update localStorage with fresh database data
      const dbData = {
        connections,
        timestamp: Date.now(),
        isRecentChange: false
      }
      localStorage.setItem(cacheKey, JSON.stringify(dbData))

    set({ connections })

    } catch (error) {
      console.error("[v0] Load connections exception:", error)
      // Fallback to cached data
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          const connections = parsed.connections || parsed // Handle both old and new formats
          set({ connections: connections })
        } catch (cacheError) {
          console.warn("[v0] Failed to parse cached connections:", cacheError)
        }
      }
    }
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

      // Update localStorage with timestamp
      const cacheData = {
        connections: updatedConnections,
        timestamp: Date.now(),
        isRecentChange: true
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))

    set({
        connections: updatedConnections,
        friendRequests: updatedFriendRequests,
      })

      // Mark as synced after successful database operation
      const syncedData = {
        connections: updatedConnections,
        timestamp: Date.now(),
        isRecentChange: false
      }
      localStorage.setItem(cacheKey, JSON.stringify(syncedData))

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
    try {
      // 🚨🚨🚨 SET GLOBAL PROTECTION FLAG
      FRIEND_REMOVAL_IN_PROGRESS = true
      console.log("[v5] 🚨🚨🚨🚨🚨 FRIEND REMOVAL FUNCTION ENTERED - GLOBAL PROTECTION ACTIVATED")
      console.log("[v5] friendId parameter:", friendId)
      console.log("[v5] friendId type:", typeof friendId)
      console.log("[v5] friendId length:", friendId?.length)

    const { user } = get()
    console.log("[v4] Current user:", user)

    if (!user) {
      console.log("[v4] ❌ NO USER - ABORTING FRIEND REMOVAL")
      return
    }

    console.log("[v4] ✅ USER FOUND - PROCEEDING WITH FRIEND REMOVAL for:", friendId)

    // IMMEDIATE UI UPDATE - Update state first for instant feedback
    console.log("[v4] 🚨🚨🚨🚨 STARTING UI UPDATE")

    const currentState = get()
    console.log("[v4] Current state connections:", currentState.connections)

    const updatedConnections = currentState.connections.filter(id => id !== friendId)
    console.log("[v4] Filtered connections - before:", currentState.connections.length, "after:", updatedConnections.length)
    console.log("[v4] Removed friend ID:", friendId)
    console.log("[v4] Updated connections array:", updatedConnections)

    // Update Zustand state immediately
    console.log("[v4] 🚨🚨🚨🚨 CALLING set() to update Zustand state")
    set({ connections: updatedConnections })

    // 🚨🚨🚨 LOCK THE CONNECTIONS STATE - No database can override this
    console.log("[v7] About to lock connections state...")
    console.log("[v7] updatedConnections:", updatedConnections)
    FRIEND_REMOVAL_LOCKED_CONNECTIONS = [...updatedConnections]
    console.log("[v7] 🚨🚨🚨🚨🚨 CONNECTIONS STATE LOCKED:", FRIEND_REMOVAL_LOCKED_CONNECTIONS)

    // Persist to localStorage so it survives page refreshes
    try {
      localStorage.setItem('mgs_friend_removal_locked_connections', JSON.stringify(FRIEND_REMOVAL_LOCKED_CONNECTIONS))
      console.log("[v7] ✅ Locked connections persisted to localStorage")
    } catch (error) {
      console.error("[v7] ❌ Failed to persist locked connections:", error)
    }

    console.log("[v4] ✅✅✅✅ Zustand state updated")

    // Verify the state update
    const verifyState = get()
    console.log("[v4] State verification - connections after set():", verifyState.connections)

    // 🚨🚨🚨🚨 ABSOLUTE LOCK CREATION - STEP BY STEP DEBUGGING
    console.log("[v4] 🚨🚨🚨🚨 STARTING LOCK CREATION PROCESS")

    const env = process.env.NODE_ENV || 'development'
    console.log("[v4] Environment:", env)

    try {

      const friendRemovalLockKey = `mgs_${env}_friend_removal_lock_${user.id}`
      console.log("[v4] Lock key:", friendRemovalLockKey)

      const removalLockData = {
        timestamp: Date.now(),
        friendId: friendId,
        action: 'friend_removed',
        expiresAt: Date.now() + 120000, // 2 minutes from now
        userId: user.id,
        lockVersion: 'v4_debug'
      }
      console.log("[v4] Lock data to save:", removalLockData)

      const jsonString = JSON.stringify(removalLockData)
      console.log("[v4] JSON string length:", jsonString.length)

      console.log("[v4] 🚨🚨🚨🚨 CALLING localStorage.setItem...")
      localStorage.setItem(friendRemovalLockKey, jsonString)
      console.log("[v4] 🚨🚨🚨🚨 localStorage.setItem completed")

      // IMMEDIATE VERIFICATION
      console.log("[v4] 🚨🚨🚨🚨 VERIFYING LOCK CREATION...")
      const verifyLock = localStorage.getItem(friendRemovalLockKey)
      console.log("[v4] Verification result:", verifyLock)

      if (!verifyLock) {
        throw new Error("Lock creation verification failed - localStorage.getItem returned null")
      }

      const parsedVerify = JSON.parse(verifyLock)
      console.log("[v4] Parsed verification:", parsedVerify)

      if (parsedVerify.friendId !== friendId) {
        throw new Error(`Lock verification failed - friendId mismatch: expected ${friendId}, got ${parsedVerify.friendId}`)
      }

      console.log("[v4] ✅✅✅✅ FRIEND REMOVAL LOCK CREATED AND VERIFIED SUCCESSFULLY")
      console.log("[v4] ✅✅✅✅ Database loads blocked for 2 minutes")

    } catch (error) {
      console.error("[v4] 🚨🚨🚨🚨 CRITICAL ERROR IN LOCK CREATION:", error)
      console.error("[v4] 🚨🚨🚨🚨 Error stack:", error.stack)
      console.log("[v4] ❌❌❌❌ LOCK CREATION FAILED - FRIENDS WILL REAPPEAR")
      // Continue anyway, but log the failure
    }

    // CRITICAL: Update localStorage with PRIORITY FLAG to prevent database override
    const cacheKey = `mgs_${env}_connections_${user.id}`
    const cacheData = {
      connections: updatedConnections,
      timestamp: Date.now(),
      isRecentChange: true, // This is CRITICAL - marks as recent change
      lastAction: 'removeFriend',
      friendId: friendId
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))

    console.log("[v2] 🚨 PRIORITY SAVED: localStorage updated with recent change flag")
    console.log("[v2] 🚨 Cache data:", cacheData)

    // DATABASE UPDATE - Handle asynchronously in background
    try {
      const supabase = createClient()
      console.log("[v1] Attempting database deletion for connections...")

      console.log("[v9] 🗑️ EXECUTING DATABASE DELETION...")
      console.log("[v9] Current user ID:", user.id)
      console.log("[v9] Target friend ID:", friendId)

      // First, let's see what connections currently exist
      console.log("[v9] 🔍 CHECKING existing connections before deletion...")
      const { data: beforeData, error: beforeError } = await supabase
        .from("connections")
        .select("*")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

      if (beforeError) {
        console.error("[v9] ❌ Error checking existing connections:", beforeError)
      } else {
        console.log("[v9] 🔍 Connections before deletion:", beforeData)
        const relevantConnections = beforeData?.filter(c =>
          (c.user_id === user.id && c.friend_id === friendId) ||
          (c.user_id === friendId && c.friend_id === user.id)
        ) || []
        console.log("[v9] 🔍 Relevant connections to delete:", relevantConnections)
      }

      // Try the delete with exact count
      console.log("[v9] 🗑️ ATTEMPTING DELETION...")
      const deleteQuery = `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
      console.log("[v9] Delete query OR condition:", deleteQuery)

      const { error, count } = await supabase
        .from("connections")
        .delete({ count: 'exact' })
        .or(deleteQuery)

      console.log("[v9] Database deletion result - count:", count, "error:", error)

      if (error) {
        console.error("[v9] 🚨 DATABASE DELETION FAILED:", error)
        console.error("[v9] 🚨 Error details:", JSON.stringify(error, null, 2))

        // Try alternative deletion method
        console.log("[v9] 🔄 TRYING ALTERNATIVE DELETION METHOD...")
        try {
          // Delete connections one by one to see which ones exist
          const { error: error1, count: count1 } = await supabase
            .from("connections")
            .delete({ count: 'exact' })
            .eq('user_id', user.id)
            .eq('friend_id', friendId)

          const { error: error2, count: count2 } = await supabase
            .from("connections")
            .delete({ count: 'exact' })
            .eq('user_id', friendId)
            .eq('friend_id', user.id)

          console.log("[v9] Alternative deletion results:")
          console.log("[v9] Direction 1 (user->friend): count =", count1, "error =", error1)
          console.log("[v9] Direction 2 (friend->user): count =", count2, "error =", error2)

          if ((count1 || 0) + (count2 || 0) > 0) {
            console.log("[v9] ✅ Alternative deletion succeeded")
          }
        } catch (altError) {
          console.error("[v9] ❌ Alternative deletion also failed:", altError)
        }

        console.log("[v9] Keeping localStorage priority flag to preserve UI state")
        // Keep the priority flag so UI state is preserved
      } else {
        console.log("[v9] ✅ Database deletion reported success -", count, "connections deleted")

        if (count === 0) {
          console.warn("[v9] ⚠️ WARNING: No connections were deleted (count = 0)")
          console.warn("[v9] This might mean the connection didn't exist in the first place")
        }

        // VERIFY the deletion actually worked
        console.log("[v8] 🔍 VERIFYING deletion by checking remaining connections...")
        const { data: verifyData, error: verifyError } = await supabase
          .from("connections")
          .select("*")
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

        if (verifyError) {
          console.error("[v8] ❌ Verification query failed:", verifyError)
        } else {
          console.log("[v9] 🔍 All user connections after deletion attempt:", verifyData?.length || 0)
          console.log("[v9] 🔍 Connection details:", verifyData)

          // Check if there are any RLS policy issues
          if (verifyData && verifyData.length > 0) {
            console.log("[v9] 🔍 Checking for RLS policy issues...")
            const authUser = await supabase.auth.getUser()
            console.log("[v9] Current authenticated user:", authUser.data.user?.id)

            // Try to select the specific connections we're trying to delete
            const { data: specificData, error: specificError } = await supabase
              .from("connections")
              .select("*")
              .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

            console.log("[v9] Specific connection query result:", specificData, "error:", specificError)
          }

          const remainingConnections = verifyData?.filter(c =>
            (c.user_id === user.id && c.friend_id === friendId) ||
            (c.user_id === friendId && c.friend_id === user.id)
          ) || []

          console.log("[v8] 🔍 Verification result - remaining connections with this friend:", remainingConnections.length)
          console.log("[v8] 🔍 Remaining connection data:", remainingConnections)

          if (remainingConnections.length === 0) {
            console.log("[v8] ✅ VERIFICATION PASSED - friend connection successfully removed from database")
          } else {
            console.error("[v8] ❌ VERIFICATION FAILED - friend connection still exists in database!")
            console.error("[v8] This means the deletion didn't work properly")
            // Don't clear the lock if verification failed
            return
          }
        }

        // 🚨🚨 CLEAR THE LOCK: Database operation succeeded
        const friendRemovalLockKey = `mgs_${env}_friend_removal_lock_${user.id}`
        localStorage.removeItem(friendRemovalLockKey)
        console.log("[v2] 🚨🚨 Friend removal lock CLEARED - database now authoritative")

        // After successful DB deletion, update localStorage to mark as synced
        // But keep the removed friend out of the connections list
        const syncedData = {
          connections: updatedConnections, // Keep the updated list (friend removed)
          timestamp: Date.now(),
          isRecentChange: false, // Now synced with DB
          lastAction: 'removeFriend',
          friendId: friendId,
          synced: true
        }
        localStorage.setItem(cacheKey, JSON.stringify(syncedData))
        console.log("[v2] ✅ localStorage marked as synced, friend permanently removed")

        // 🚨🚨🚨 CLEAR LOCKED CONNECTIONS AFTER SUCCESSFUL DB OPERATION
        console.log("[v7] About to clear locked connections...")
        console.log("[v7] FRIEND_REMOVAL_LOCKED_CONNECTIONS before clearing:", FRIEND_REMOVAL_LOCKED_CONNECTIONS)
        FRIEND_REMOVAL_LOCKED_CONNECTIONS = null
        console.log("[v7] 🚨🚨🚨🚨🚨 LOCKED CONNECTIONS CLEARED - database now authoritative")

        // Clear from localStorage
        try {
          localStorage.removeItem('mgs_friend_removal_locked_connections')
          console.log("[v7] ✅ Locked connections cleared from localStorage")
        } catch (error) {
          console.error("[v7] ❌ Failed to clear locked connections from localStorage:", error)
        }
      }
    } catch (error) {
      console.error("[v1] 🚨 ERROR in database operation:", error)
      console.log("[v1] Keeping UI state due to database error")
      // Keep locked connections on error to preserve UI state
    }

    console.log("[v1] 🚨 FRIEND REMOVAL PROCESS COMPLETE - UI should stay updated")

    // 🚨🚨🚨 CLEAR GLOBAL PROTECTION FLAG
    FRIEND_REMOVAL_IN_PROGRESS = false
    console.log("[v5] 🚨🚨🚨🚨🚨 GLOBAL PROTECTION CLEARED - loadConnections can resume")

    } catch (globalError) {
      console.error("[v5] 🚨🚨🚨🚨🚨 CRITICAL ERROR IN FRIEND REMOVAL FUNCTION:", globalError)
      console.error("[v5] 🚨🚨🚨🚨🚨 Error stack:", globalError.stack)
      console.error("[v5] 🚨🚨🚨🚨🚨 This is why friends reappear - function crashed!")

      // 🚨🚨🚨 CLEAR FLAG EVEN ON ERROR
      FRIEND_REMOVAL_IN_PROGRESS = false
      console.log("[v5] 🚨🚨🚨🚨🚨 GLOBAL PROTECTION CLEARED DUE TO ERROR")

      // Re-throw to let React error boundary catch it
      throw globalError
    }
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
      console.error("[v0] Send DM error:", error);
      return;
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

  // Debug function for troubleshooting friends list issues
  debugConnections: () => {
    const { user, connections } = get()
    const env = process.env.NODE_ENV || 'development'
    const cacheKey = `mgs_${env}_connections_${user?.id}`

    console.log("=== CONNECTIONS DEBUG ===")
    console.log("User:", user?.id)
    console.log("Environment:", env)
    console.log("Current connections state:", connections)
    console.log("localStorage key:", cacheKey)
    console.log("localStorage value:", localStorage.getItem(cacheKey))

    if (user) {
      console.log("Reloading connections from database...")
      get().loadConnections()
    }

    return {
      user: user?.id,
      connections,
      cacheKey,
      cached: localStorage.getItem(cacheKey),
      environment: env
    }
  },

  // Force re-render function for debugging UI issues
  forceRerender: () => {
    console.log("=== FORCE RE-RENDER ===")
    // This will trigger a re-render by slightly modifying the state
    const { connections } = get()
    set({ connections: [...connections] })
    console.log("Forced re-render triggered")
  },

  // Force reload connections from database for debugging
  forceReloadConnections: async () => {
    console.log("=== FORCE RELOAD CONNECTIONS ===")
    await get().loadConnections()
    console.log("Connections reloaded from database")
  },

  // Debug: Force use localStorage data regardless of timestamp
  forceUseLocalStorage: () => {
    console.log("=== FORCE USE LOCALSTORAGE ===")
    const { user } = get()
    if (!user) {
      console.log("No user logged in")
      return
    }

    const env = process.env.NODE_ENV || 'development'
    const cacheKey = `mgs_${env}_connections_${user.id}`
    const cachedData = localStorage.getItem(cacheKey)

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        console.log("Forcing use of localStorage data:", parsed.connections)
        set({ connections: parsed.connections })
      } catch (error) {
        console.warn("Failed to parse localStorage data:", error)
      }
    } else {
      console.log("No localStorage data found")
    }
  },

  // Debug: Comprehensive friend removal troubleshooting
  debugFriendRemoval: () => {
    console.log("=== FRIEND REMOVAL DEBUG ===")
    const { user, connections } = get()

    if (!user) {
      console.log("❌ No user logged in")
      return
    }

    const env = process.env.NODE_ENV || 'development'
    const cacheKey = `mgs_${env}_connections_${user.id}`
    const cachedData = localStorage.getItem(cacheKey)

    console.log("Current user ID:", user.id)
    console.log("Current connections in state:", connections)
    console.log("Environment:", env)
    console.log("Cache key:", cacheKey)

    // 🚨🚨🚨 Check for friend removal lock
    const friendRemovalLockKey = `mgs_${env}_friend_removal_lock_${user.id}`
    console.log("🚨🚨🚨 Checking friend removal lock key:", friendRemovalLockKey)

    const removalLock = localStorage.getItem(friendRemovalLockKey)
    console.log("🚨🚨🚨 Raw lock data from localStorage:", removalLock)

    if (removalLock) {
      try {
        const lockData = JSON.parse(removalLock)
        const lockAge = Date.now() - lockData.timestamp
        const isActive = lockAge < 120000
        console.log("🚨🚨🚨 FRIEND REMOVAL LOCK STATUS:")
        console.log("  - Lock exists:", true)
        console.log("  - Lock active:", isActive)
        console.log("  - Lock age:", lockAge, "ms")
        console.log("  - Friend ID:", lockData.friendId)
        console.log("  - Lock version:", lockData.lockVersion)
        console.log("  - Expires at:", new Date(lockData.expiresAt))
        console.log("  - User ID:", lockData.userId)
        if (isActive) {
          console.log("  - STATUS: 🚨🚨🚨 DATABASE LOADS BLOCKED - FRIEND WILL STAY REMOVED ✅")
        } else {
          console.log("  - STATUS: Lock expired, will be cleared on next loadConnections")
        }
      } catch (error) {
        console.error("❌ Failed to parse removal lock:", error)
      }
    } else {
      console.log("🚨🚨🚨 No friend removal lock found - THIS IS WHY FRIENDS REAPPEAR!")
      console.log("🚨🚨🚨 Lock should be created when removeFriend() is called")
    }

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        console.log("localStorage data:", parsed)
        console.log("Timestamp age:", Date.now() - parsed.timestamp, "ms")
        console.log("Is recent change?", parsed.isRecentChange)
        console.log("Last action:", parsed.lastAction)
        console.log("Friend ID involved:", parsed.friendId)

        const timeDiff = Date.now() - parsed.timestamp
        const isRecent = parsed.isRecentChange && timeDiff < 120000
        console.log("Would loadConnections() use localStorage?", isRecent)

      } catch (error) {
        console.error("❌ Failed to parse localStorage:", error)
      }
    } else {
      console.log("❌ No localStorage data found")
    }

    return {
      userId: user.id,
      connections,
      cacheKey,
      cachedData: cachedData ? JSON.parse(cachedData) : null,
      environment: env
    }
  },

  // Debug: Check spaces for duplicates
  debugSpaces: () => {
    console.log("=== SPACES DEBUG ===")
    const { spaces, currentSpaceId } = get()

    console.log("Total spaces:", spaces.length)
    console.log("Current space ID:", currentSpaceId)
    console.log("Space names:", spaces.map(s => s.name))
    console.log("Space IDs:", spaces.map(s => s.id))

    // Check for duplicates
    const nameCounts: Record<string, number> = {}
    const idCounts: Record<string, number> = {}

    spaces.forEach(space => {
      nameCounts[space.name] = (nameCounts[space.name] || 0) + 1
      idCounts[space.id] = (idCounts[space.id] || 0) + 1
    })

    const nameDuplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1)
    const idDuplicates = Object.entries(idCounts).filter(([id, count]) => count > 1)

    if (nameDuplicates.length > 0) {
      console.log("DUPLICATE SPACE NAMES FOUND:", nameDuplicates)
    }
    if (idDuplicates.length > 0) {
      console.log("DUPLICATE SPACE IDS FOUND:", idDuplicates)
    }

    if (nameDuplicates.length === 0 && idDuplicates.length === 0) {
      console.log("No duplicate spaces found")
    }

    return { spaces, nameDuplicates, idDuplicates, nameCounts, idCounts }
  },

  // Fix: Remove duplicate spaces from UI
  fixDuplicateSpaces: () => {
    console.log("=== FIXING UI DUPLICATE SPACES ===")
    const { spaces } = get()

    // Remove duplicates by ID, keeping the first occurrence
    const seenIds = new Set()
    const uniqueSpaces = spaces.filter(space => {
      if (seenIds.has(space.id)) {
        console.log("Removing UI duplicate space:", space.name, space.id)
        return false
      }
      seenIds.add(space.id)
      return true
    })

    if (uniqueSpaces.length !== spaces.length) {
      console.log(`Removed ${spaces.length - uniqueSpaces.length} UI duplicate spaces`)
      set({ spaces: uniqueSpaces })
      console.log("UI spaces fixed:", uniqueSpaces.map(s => ({ id: s.id, name: s.name })))
    } else {
      console.log("No UI duplicates found to fix")
    }

    return uniqueSpaces
  },

  // Fix: Clean up database duplicates (run SQL in Supabase)
  generateCleanupSQL: () => {
    console.log("=== DATABASE DUPLICATE CLEANUP SQL ===")
    console.log("Run this SQL in Supabase SQL Editor:")
    console.log("")

    const cleanupSQL = `
-- Find and delete duplicate spaces (keep the oldest by creation date)
WITH duplicates AS (
  SELECT id, name,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
  FROM spaces
  WHERE name != 'Global Feed'
)
DELETE FROM spaces
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Update member counts after cleanup
UPDATE spaces
SET member_count = (
  SELECT COUNT(*) FROM space_members WHERE space_id = spaces.id
) + 1 -- +1 for owner
WHERE member_count IS NULL OR member_count < 1;

-- Verify cleanup
SELECT name, COUNT(*) as count
FROM spaces
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;
`

    console.log(cleanupSQL)
    return cleanupSQL
  },
}))

// Export the store for console debugging
export const appStore = store

// Global friend removal protection (persisted in localStorage)
let FRIEND_REMOVAL_IN_PROGRESS = false
let FRIEND_REMOVAL_LOCKED_CONNECTIONS: string[] | null = null

// Initialize locked connections from localStorage on module load
if (typeof window !== 'undefined') {
  try {
    const persistedLock = localStorage.getItem('mgs_friend_removal_locked_connections')
    if (persistedLock) {
      FRIEND_REMOVAL_LOCKED_CONNECTIONS = JSON.parse(persistedLock)
      console.log("[v7] 🔄 RESTORED LOCKED CONNECTIONS FROM localStorage:", FRIEND_REMOVAL_LOCKED_CONNECTIONS)
    }
  } catch (error) {
    console.warn("[v7] Failed to restore locked connections from localStorage:", error)
    localStorage.removeItem('mgs_friend_removal_locked_connections')
  }
}

// Attach to window for development debugging
if (typeof window !== 'undefined') {
  (window as any).store = store
  console.log("[DEBUG] Store attached to window:", typeof (window as any).store)
  console.log("[DEBUG] Available store methods:", Object.keys(store.getState()))

  // Global error handler to catch the red error text
  window.addEventListener('error', (event) => {
    console.error("[GLOBAL] 🚨🚨🚨🚨🚨 Unhandled error caught:", event.error)
    console.error("[GLOBAL] 🚨🚨🚨🚨🚨 Error message:", event.message)
    console.error("[GLOBAL] 🚨🚨🚨🚨🚨 Error stack:", event.error?.stack)
    console.error("[GLOBAL] 🚨🚨🚨🚨🚨 This might be the red error text you're seeing!")
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error("[GLOBAL] 🚨🚨🚨🚨🚨 Unhandled promise rejection:", event.reason)
    console.error("[GLOBAL] 🚨🚨🚨🚨🚨 This might be causing the red error text!")
  })
}

// Global debug access (immediate)
declare global {
  interface Window {
    store: typeof store
    debugSpaces: () => any
    fixDuplicateSpaces: () => any
    generateCleanupSQL: () => string
  }
}

// Expose debug functions globally
if (typeof window !== 'undefined') {
  window.debugSpaces = store.getState().debugSpaces
  window.fixDuplicateSpaces = store.getState().fixDuplicateSpaces
  window.generateCleanupSQL = store.getState().generateCleanupSQL
  window.debugFriendRemoval = store.getState().debugFriendRemoval
}

export const useAppStore = store
