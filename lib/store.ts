"use client"

import { create } from "zustand"
import type {
  User,
  Space,
  JournalEntry,
  Theme,
  MentalState,
  MilestoneLevel,
  UserProfile,
  Comment,
  Like,
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

  lastLoadedProfilesAt: number
  lastLoadedEntriesAt: Record<string, number>

  // Spaces
  spaces: Space[]
  currentSpaceId: string | null
  setCurrentSpace: (spaceId: string) => void
  createSpace: (name: string, description?: string, isPrivate?: boolean) => void
  joinSpace: (spaceId: string) => Promise<void>
  leaveSpace: (spaceId: string) => void

  // Entries
  entries: Record<string, JournalEntry[]>
  entriesCursor: Record<string, { createdAt: string; id: string } | null>
  hasMoreEntries: Record<string, boolean>
  isLoadingMoreEntries: Record<string, boolean>
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
  forceLoadEntries: (spaceId: string) => Promise<void>
  loadMoreEntries: (spaceId: string) => Promise<void>

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

  profiles: UserProfile[]
  loadProfiles: () => Promise<void>

  // Space Members
  getSpaceMembers: (spaceId: string) => UserProfile[]

  getProfile: (userId: string) => UserProfile | undefined
  findUserByTag: (usernameWithTag: string) => Promise<UserProfile | undefined>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  adminUpdateUserProfile: (userId: string, updates: Partial<UserProfile>) => void

  // Comments and Likes
  comments: Record<string, Comment[]>
  likes: Record<string, Like[]>
  loadCommentsAndLikes: (spaceId: string) => Promise<void>
  addComment: (entryId: string, content: string) => Promise<void>
  deleteComment: (commentId: string, entryId: string) => Promise<void>
  addLike: (entryId: string) => Promise<void>
  removeLike: (entryId: string) => Promise<void>
  hasLiked: (entryId: string) => boolean
  getLikeCount: (entryId: string) => number
  getComments: (entryId: string) => Comment[]
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: () => get().user?.email === ADMIN_EMAIL,

  login: async (email: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      console.error("[AUTH] Login error:", error)
      return false
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      username: profile?.username || email.split("@")[0],
      tag: profile?.tag || generateTag(),
      createdAt: new Date(),
    }

    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    })

    // Load data
    void Promise.allSettled([
      get().loadProfiles(),
    ])

    return true
  },

  signup: async (email: string, password: string, username: string) => {
    const supabase = createClient()
    const tag = generateTag()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          tag,
        },
      },
    })

    if (error || !data.user) {
      console.error("[AUTH] Signup error:", error)
      return false
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      username,
      email,
      tag,
    })

    if (profileError) {
      console.error("[AUTH] Profile creation error:", profileError)
      return false
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      username,
      tag,
      createdAt: new Date(),
    }

    // Join Global Feed space
    await supabase.from("space_members").insert({
      space_id: "00000000-0000-0000-0000-000000000001",
      user_id: data.user.id,
    })

    set({
      user,
      isAuthenticated: true,
      isLoading: false,
      spaces: [globalFeedSpace], // New users start with only Global Feed
      currentSpaceId: "space-global",
      profiles: [{
        id: data.user.id,
        username,
        email,
        tag,
        bio: "",
        socialLinks: {},
        createdAt: new Date(),
      }],
    })

    // Load data
    void Promise.allSettled([
      get().loadProfiles(),
    ])

    return true
  },

  resetPassword: async (email: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      console.error("[AUTH] Reset password error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  },

  logout: () => {
    const supabase = createClient()
    supabase.auth.signOut()

    const user = get().user
    if (user) {
      // Clear current environment
      const env = process.env.NODE_ENV || 'development'
      localStorage.removeItem(`mgs_${env}_profiles_${user.id}`)

      // Also clear other environments to prevent conflicts
      localStorage.removeItem(`mgs_development_profiles_${user.id}`)
      localStorage.removeItem(`mgs_production_profiles_${user.id}`)
    }

    set({
      user: null,
      isAuthenticated: false,
      spaces: [globalFeedSpace],
      currentSpaceId: "space-global",
    })
  },

  initializeAuth: async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        username: profile?.username || session.user.email!.split("@")[0],
        tag: profile?.tag || generateTag(),
        createdAt: session.user.created_at ? new Date(session.user.created_at) : new Date(),
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      })

      // Load data
      void Promise.allSettled([
        get().loadProfiles(),
      ])
    } else {
      set({ isLoading: false })
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        get().initializeAuth()
      } else if (event === "SIGNED_OUT") {
        set({
          user: null,
          isAuthenticated: false,
          spaces: [globalFeedSpace],
          currentSpaceId: "space-global",
        })
      }
    })
  },

  lastLoadedProfilesAt: 0,
  lastLoadedEntriesAt: {},

  // Spaces
  spaces: [globalFeedSpace],
  currentSpaceId: "space-global",

  setCurrentSpace: (spaceId: string) => {
    const { loadEntries, loadCommentsAndLikes } = get()
    set({ currentSpaceId: spaceId })
    void Promise.allSettled([
      loadEntries(spaceId),
      loadCommentsAndLikes(spaceId),
    ])
  },

  createSpace: async (name: string, description?: string, isPrivate?: boolean) => {
    const { user } = get()
    if (!user) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from("spaces")
      .insert({
        name,
        description,
        owner_id: user.id,
        is_private: isPrivate || false,
      })
      .select()
      .single()

    if (error || !data) {
      console.error("[SPACE] Create error:", error)
      return
    }

    const space: Space = {
      id: data.id,
      name: data.name,
      description: data.description || "",
      ownerId: data.owner_id,
      isPrivate: data.is_private,
      createdAt: new Date(data.created_at),
      memberCount: 1,
    }

    set((state) => ({
      spaces: [...state.spaces, space],
      currentSpaceId: space.id,
    }))

    // Join the space
    await get().joinSpace(space.id)
  },

  joinSpace: async (spaceId: string) => {
    const { user } = get()
    if (!user) return

    const supabase = createClient()
    const { error } = await supabase.from("space_members").insert({
      space_id: spaceId,
      user_id: user.id,
    })

    if (error) {
      console.error("[SPACE] Join error:", error)
      return
    }

    // Update member count
    set((state) => ({
      spaces: state.spaces.map((space) =>
        space.id === spaceId
          ? { ...space, memberCount: space.memberCount + 1 }
          : space
      ),
    }))
  },

  leaveSpace: async (spaceId: string) => {
    const { user } = get()
    if (!user) return

    const supabase = createClient()
    const { error } = await supabase
      .from("space_members")
      .delete()
      .eq("space_id", spaceId)
      .eq("user_id", user.id)

    if (error) {
      console.error("[SPACE] Leave error:", error)
      return
    }

    // Update member count and switch to global if needed
    set((state) => {
      const newSpaces = state.spaces.map((space) =>
        space.id === spaceId
          ? { ...space, memberCount: space.memberCount - 1 }
          : space
      )

      return {
        spaces: newSpaces,
        currentSpaceId: state.currentSpaceId === spaceId ? "space-global" : state.currentSpaceId,
        entries: Object.fromEntries(
          Object.entries(state.entries).filter(([key]) => key !== spaceId)
        ),
        comments: Object.fromEntries(
          Object.entries(state.comments).filter(([key]) => key !== spaceId)
        ),
        likes: Object.fromEntries(
          Object.entries(state.likes).filter(([key]) => key !== spaceId)
        ),
      }
    })
  },

  // Entries
  entries: {},
  entriesCursor: {},
  hasMoreEntries: {},
  isLoadingMoreEntries: {},

  addEntry: async (
    content: string,
    tags?: string[],
    tradeType?: JournalEntry["tradeType"],
    profitLoss?: number,
    image?: string,
    mentalState?: MentalState,
  ) => {
    const { currentSpaceId, user, entries } = get()
    if (!currentSpaceId || !user || !user.id) {
      console.error("[ENTRY] 🚨 MISSING REQUIRED DATA:", { 
        hasCurrentSpaceId: !!currentSpaceId, 
        hasUser: !!user, 
        hasUserId: !!user?.id 
      })
      return
    }

    const optimisticId = `optimistic-${Date.now()}`
    const optimisticEntry: JournalEntry = {
      id: optimisticId,
      spaceId: currentSpaceId,
      userId: user.id,
      username: user.username,
      content,
      tags: tags || [],
      tradeType,
      profitLoss,
      image,
      mentalState,
      createdAt: new Date(),
    }

    // Add optimistic entry
    set({
      entries: {
        ...entries,
        [currentSpaceId]: currentSpaceId ? [optimisticEntry, ...(entries[currentSpaceId] || [])] : [],
      },
    })

    const supabase = createClient()
    const actualSpaceId = currentSpaceId === "space-global" 
      ? "00000000-0000-0000-0000-000000000001" 
      : currentSpaceId

    const insertData = {
      space_id: actualSpaceId,
      content,
      tags: tags || [],
      trade_type: tradeType,
      profit_loss: profitLoss,
      image,
      mental_state: mentalState,
      user_id: user.id,
    }

    const { data, error } = await supabase
      .from("entries")
      .insert(insertData)
      .select()
      .single()

    if (error || !data) {
      console.error("[ENTRY] Add error:", error)
      // Remove optimistic entry
      set((state) => ({
        entries: {
          ...state.entries,
          [currentSpaceId]: currentSpaceId ? state.entries[currentSpaceId]?.filter(
            (e) => e.id !== optimisticId
          ) || [] : [],
        },
      }))
      return
    }

    const realEntry: JournalEntry = {
      id: data.id,
      spaceId: currentSpaceId,
      userId: data.user_id,
      username: user.username,
      content: data.content,
      tags: data.tags || [],
      tradeType: data.trade_type,
      profitLoss: data.profit_loss,
      image: data.image,
      mentalState: data.mental_state,
      createdAt: new Date(data.created_at),
    }

    // Replace optimistic entry with real one
    set((state) => ({
      entries: {
        ...state.entries,
        [currentSpaceId]: currentSpaceId ? [realEntry, ...(state.entries[currentSpaceId] || []).filter(
          (e) => e.id !== optimisticId
        )] : [],
      },
    }))
  },

  deleteEntry: async (entryId: string, spaceId: string) => {
    const supabase = createClient()
    const actualSpaceId = spaceId === "space-global" 
      ? "00000000-0000-0000-0000-000000000001" 
      : spaceId

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", entryId)

    if (error) {
      console.error("[ENTRY] Delete error:", error)
      return
    }

    set((state) => ({
      entries: {
        ...state.entries,
        [spaceId]: state.entries[spaceId]?.filter((e) => e.id !== entryId) || [],
      },
    }))
  },

  loadEntries: async (spaceId: string) => {
    const { lastLoadedEntriesAt, entries } = get()
    if (Date.now() - (lastLoadedEntriesAt[spaceId] || 0) < 1_000) {
      console.log("[ENTRY] ⏱️ Using cached entries (loaded < 1s ago)")
      return
    }

    const supabase = createClient()
    const actualSpaceId = spaceId === "space-global" 
      ? "00000000-0000-0000-0000-000000000001" 
      : spaceId

    console.log("[ENTRY] Loading entries for:", spaceId, "→", actualSpaceId)
    console.log("[ENTRY] Current space ID in store:", get().currentSpaceId)

    try {
      // Test with minimal columns first - INCLUDE pnl AND image
      console.log("[ENTRY] Testing with minimal columns...")
      const { data: testData, error: testError } = await supabase
        .from("entries")
        .select("id, space_id, user_id, content, image, pnl, created_at")
        .eq("space_id", actualSpaceId)
        .order("created_at", { ascending: false })
        .limit(10)

      console.log("[ENTRY] Test result:", { 
        count: testData?.length || 0, 
        error: testError,
        errorMessage: testError?.message,
        sampleData: testData?.map(e => ({
          id: e.id,
          hasPnl: e.pnl !== null && e.pnl !== undefined,
          pnlValue: e.pnl,
          hasImage: !!e.image,
          imageLength: e.image?.length || 0
        })) || []
      })

      if (testError) {
        console.error("[ENTRY] ❌ Even minimal query failed:", testError.message)
        set({
          entries: { ...entries, [spaceId]: [] },
          lastLoadedEntriesAt: { ...lastLoadedEntriesAt, [spaceId]: Date.now() },
        })
        return
      }

      // If minimal query works, use it
      const mappedEntries = (testData || []).filter(e => e != null).map((e: any) => {
        const hasImage = !!e.image;
        const hasPnl = e.pnl !== null && e.pnl !== undefined;
        if (hasImage) {
          console.log("[ENTRY] 📸 Found image:", e.image?.substring(0, 50) + "...");
        }
        if (hasPnl) {
          console.log("[ENTRY] 💰 Found pnl:", e.pnl, "type:", typeof e.pnl);
        }
        console.log("[ENTRY] 📝 Found entry:", e.id, e.content?.substring(0, 30) + "...");
        return {
          id: e.id,
          spaceId,
          userId: e.user_id,
          username: "Unknown",
          content: e.content,
          tags: [],
          tradeType: "general" as any,
          profitLoss: e.pnl ? parseFloat(e.pnl) : undefined,
          image: e.image,
          mentalState: undefined,
          createdAt: new Date(e.created_at),
        };
      })

      console.log("[ENTRY] ✅ Loaded", mappedEntries.length, "entries (minimal)")
      console.log("[ENTRY] 📊 Sample entries:", mappedEntries.map(e => ({
        id: e.id,
        content: e.content?.substring(0, 30) + "...",
        spaceId: e.spaceId,
        createdAt: e.createdAt
      })))
      set({
        entries: { ...entries, [spaceId]: mappedEntries },
        lastLoadedEntriesAt: { ...lastLoadedEntriesAt, [spaceId]: Date.now() },
      })

    } catch (err) {
      console.error("[ENTRY] 💥 Unexpected error:", err)
      set({
        entries: { ...entries, [spaceId]: [] },
        lastLoadedEntriesAt: { ...lastLoadedEntriesAt, [spaceId]: Date.now() },
      })
    }
  },

  forceLoadEntries: async (spaceId: string) => {
    console.log("[ENTRY] 🔄 Force loading entries (bypassing cache)")
    const { lastLoadedEntriesAt, entries } = get()
    
    // Clear the cache timestamp to force reload
    set({
      lastLoadedEntriesAt: { ...lastLoadedEntriesAt, [spaceId]: 0 }
    })
    
    // Call loadEntries which will now reload from database
    await get().loadEntries(spaceId)
  },

  loadMoreEntries: async (spaceId: string) => {
    const { entries, entriesCursor, hasMoreEntries, isLoadingMoreEntries } = get()
    
    if (isLoadingMoreEntries[spaceId] || !hasMoreEntries[spaceId]) {
      return
    }

    const cursor = entriesCursor[spaceId]
    if (!cursor) return

    set((state) => ({
      isLoadingMoreEntries: { ...state.isLoadingMoreEntries, [spaceId]: true },
    }))

    const supabase = createClient()
    const actualSpaceId = spaceId === "space-global" 
      ? "00000000-0000-0000-0000-000000000001" 
      : spaceId

    const pageSize = 20
    const entrySelectFull = "id, space_id, user_id, username, content, tags, trade_type, pnl, image, mental_state, created_at"
    const entrySelectFallback = "id, space_id, user_id, username, content, tags, trade_type, pnl, image, mental_state, created_at"

    const baseQuery = (select: string) =>
      supabase
        .from("entries")
        .select(select)
        .eq("space_id", actualSpaceId)
        .lt("created_at", cursor.createdAt)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(pageSize)

    // Try full select first
    let query = baseQuery(entrySelectFull)
    const { data: entriesData, error: entriesError } = await query

    let newEntries: any[] = []
    let hasMore = false

    if (entriesError) {
      console.error("[ENTRY] Load more error with full select:", entriesError)
      
      // Try fallback select
      const { data: fallbackData, error: fallbackError } = await baseQuery(entrySelectFallback)
      
      if (fallbackError) {
        console.error("[ENTRY] Load more error with fallback select:", fallbackError)
      } else {
        newEntries = fallbackData || []
        hasMore = newEntries.length === pageSize
      }
    } else {
      newEntries = entriesData || []
      hasMore = newEntries.length === pageSize
    }

    // Map entries with schema tolerance
    const mappedEntries = newEntries.filter(e => e != null).map((e: any) => ({
      id: e.id,
      spaceId,
      userId: e.user_id,
      username: e.username || "Unknown",
      content: e.content,
      tags: e.tags || [],
      tradeType: e.trade_type,
      profitLoss: e.pnl ? parseFloat(e.pnl) : undefined,
      image: e.image,
      mentalState: e.mental_state,
      createdAt: new Date(e.created_at),
    }))

    const currentEntries = entries[spaceId] || []
    const newCursor = mappedEntries.length > 0 
      ? { createdAt: mappedEntries[mappedEntries.length - 1].createdAt.toISOString(), id: mappedEntries[mappedEntries.length - 1].id }
      : null

    set((state) => ({
      entries: {
        ...state.entries,
        [spaceId]: [...currentEntries, ...mappedEntries],
      },
      entriesCursor: {
        ...state.entriesCursor,
        [spaceId]: newCursor,
      },
      hasMoreEntries: {
        ...state.hasMoreEntries,
        [spaceId]: hasMore,
      },
      isLoadingMoreEntries: {
        ...state.isLoadingMoreEntries,
        [spaceId]: false,
      },
    }))
  },

  getCollectiveVibe: () => {
    const { entries, currentSpaceId } = get()
    const spaceEntries = (currentSpaceId && entries[currentSpaceId]) || []
    return calculateCollectiveVibe(spaceEntries)
  },

  getVibeThemeClass: () => {
    const vibe = get().getCollectiveVibe()
    return vibe ? getVibeTheme(vibe) : null
  },

  // UI
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  // Theme
  theme: "dark" as Theme,
  setTheme: (theme: Theme) => set({ theme }),

  // Milestone state
  getSpaceStats: () => {
    const { entries, currentSpaceId } = get()
    return calculateSpaceStats(currentSpaceId ? entries[currentSpaceId] || [] : [])
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
    const stats = get().getSpaceStats()
    return getUnlockedThemes(stats.totalWins)
  },

  profiles: [],

  loadProfiles: async () => {
    const { lastLoadedProfilesAt } = get()
    if (Date.now() - lastLoadedProfilesAt < 60_000) {
      return
    }

    const supabase = createClient()
    const profileSelectFull = "id, username, tag, email, avatar, bio, trading_style, win_rate, total_trades, social_links, created_at"
    const profileSelectFallback = "id, username, tag, email, avatar, bio, win_rate, social_links, created_at"

    let query = supabase
      .from("profiles")
      .select(profileSelectFull)
      .order("created_at", { ascending: false })
      .limit(500)

    const { data: profilesData, error: profilesError } = await query

    if (profilesError) {
      console.error("[PROFILE] Load error with full select:", profilesError)
      
      // Try fallback select
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("profiles")
        .select(profileSelectFallback)
        .order("created_at", { ascending: false })
        .limit(500)

      if (fallbackError) {
        console.error("[PROFILE] Load error with fallback select:", fallbackError)
        set({ lastLoadedProfilesAt: Date.now() })
        return
      }

      const mappedProfiles = (fallbackData || []).filter(p => p != null).map((p: any) => ({
        id: p.id,
        username: p.username || "Unknown",
        tag: p.tag || "0000",
        email: p.email || "",
        avatar: p.avatar,
        bio: p.bio || "",
        tradingStyle: p.trading_style,
        winRate: p.win_rate,
        totalTrades: p.total_trades,
        socialLinks: p.social_links || {},
        createdAt: new Date(p.created_at),
      }))

      set({ profiles: mappedProfiles, lastLoadedProfilesAt: Date.now() })
      return
    }

    const mappedProfiles = (profilesData || []).filter(p => p != null).map((p: any) => ({
      id: p.id,
      username: p.username || "Unknown",
      tag: p.tag || "0000",
      email: p.email || "",
      avatar: p.avatar,
      bio: p.bio || "",
      tradingStyle: p.trading_style,
      winRate: p.win_rate,
      totalTrades: p.total_trades,
      socialLinks: p.social_links || {},
      createdAt: new Date(p.created_at),
    }))

    set({ profiles: mappedProfiles, lastLoadedProfilesAt: Date.now() })

    // Backfill usernames in entries after profiles load
    const { entries } = get()
    const updatedEntries = Object.entries(entries).reduce((acc, [spaceId, spaceEntries]) => {
      const entriesWithUsernames = spaceEntries.map(entry => {
        if (!entry.username || entry.username === "Unknown") {
          const profile = mappedProfiles.find(p => p.id === entry.userId)
          if (profile) {
            return { ...entry, username: profile.username }
          }
        }
        return entry
      })
      acc[spaceId] = entriesWithUsernames
      return acc
    }, {} as Record<string, JournalEntry[]>)

    set({ entries: updatedEntries })
  },

  getSpaceMembers: (spaceId: string) => {
    const { profiles, user } = get()
    if (spaceId === "space-global") {
      return profiles.filter(p => p != null && p.id !== user?.id)
    }
    return profiles.filter(p => p != null && p.id !== user?.id)
  },

  getProfile: (userId: string) => {
    return get().profiles.find(p => p != null && p.id === userId)
  },

  findUserByTag: async (usernameWithTag: string) => {
    const [username, tag] = usernameWithTag.split("#")
    if (!username || !tag) return undefined

    const profile = get().profiles.find(
      p => p != null && p.username === username && p.tag === tag
    )
    return profile
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { user } = get()
    if (!user) return

    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)

    if (error) {
      console.error("[PROFILE] Update error:", error)
      return
    }

    set((state) => ({
      profiles: state.profiles.map(p =>
        p.id === user.id ? { ...p, ...updates } : p
      ),
    }))
  },

  adminUpdateUserProfile: (userId: string, updates: Partial<UserProfile>) => {
    set((state) => ({
      profiles: state.profiles.map(p =>
        p.id === userId ? { ...p, ...updates } : p
      ),
    }))
  },

  // Comments and Likes
  comments: {},
  likes: {},

  loadCommentsAndLikes: async (spaceId: string) => {
    const supabase = createClient()
    const actualSpaceId = spaceId === "space-global" 
      ? "00000000-0000-0000-0000-000000000001" 
      : spaceId

    const [commentsResult, likesResult] = await Promise.allSettled([
      supabase
        .from("comments")
        .select("*")
        .in("entry_id", 
          Object.values(get().entries[spaceId] || []).map(e => e.id)
        ),
      supabase
        .from("likes")
        .select("*")
        .in("entry_id", 
          Object.values(get().entries[spaceId] || []).map(e => e.id)
        ),
    ])

    const comments = commentsResult.status === "fulfilled" 
      ? (commentsResult.value.data || []).filter(c => c != null).map((c: any) => ({
          id: c.id,
          entryId: c.entry_id,
          userId: c.user_id,
          username: c.username || "Unknown",
          content: c.content,
          createdAt: new Date(c.created_at),
        }))
      : []

    const likes = likesResult.status === "fulfilled"
      ? (likesResult.value.data || []).filter(l => l != null).map((l: any) => ({
          id: l.id,
          entryId: l.entry_id,
          userId: l.user_id,
          createdAt: new Date(l.created_at),
        }))
      : []

    set({
      comments: { ...get().comments, [spaceId]: comments },
      likes: { ...get().likes, [spaceId]: likes },
    })
  },

  addComment: async (entryId: string, content: string) => {
    const { user } = get()
    if (!user) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from("comments")
      .insert({
        entry_id: entryId,
        content,
      })
      .select()
      .single()

    if (error || !data) {
      console.error("[COMMENT] Add error:", error)
      return
    }

    const comment: Comment = {
      id: data.id,
      entryId: data.entry_id,
      userId: data.user_id,
      username: user.username,
      content: data.content,
      createdAt: new Date(data.created_at),
    }

    set((state) => {
      const spaceId = Object.keys(state.entries).find(sid =>
        state.entries[sid]?.some(e => e.id === entryId)
      )
      if (!spaceId) return state

      return {
        comments: {
          ...state.comments,
          [spaceId]: [...(state.comments[spaceId] || []), comment],
        },
      }
    })
  },

  deleteComment: async (commentId: string, entryId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)

    if (error) {
      console.error("[COMMENT] Delete error:", error)
      return
    }

    set((state) => {
      const spaceId = Object.keys(state.entries).find(sid =>
        state.entries[sid]?.some(e => e.id === entryId)
      )
      if (!spaceId) return state

      return {
        comments: {
          ...state.comments,
          [spaceId]: state.comments[spaceId]?.filter(c => c.id !== commentId) || [],
        },
      }
    })
  },

  addLike: async (entryId: string) => {
    const { user, likes } = get()
    if (!user) return

    // Check if already liked
    const spaceId = Object.keys(get().entries).find(sid =>
      get().entries[sid]?.some(e => e.id === entryId)
    )
    if (!spaceId) return

    const alreadyLiked = likes[spaceId]?.some(
      l => l.entryId === entryId && l.userId === user.id
    )
    if (alreadyLiked) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from("likes")
      .insert({
        entry_id: entryId,
      })
      .select()
      .single()

    if (error || !data) {
      console.error("[LIKE] Add error:", error)
      return
    }

    const like: Like = {
      id: data.id,
      entryId: data.entry_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
    }

    set((state) => ({
      likes: {
        ...state.likes,
        [spaceId]: [...(state.likes[spaceId] || []), like],
      },
    }))
  },

  removeLike: async (entryId: string) => {
    const { user, likes } = get()
    if (!user) return

    const supabase = createClient()
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("entry_id", entryId)
      .eq("user_id", user.id)

    if (error) {
      console.error("[LIKE] Remove error:", error)
      return
    }

    set((state) => {
      const spaceId = Object.keys(state.entries).find(sid =>
        state.entries[sid]?.some(e => e.id === entryId)
      )
      if (!spaceId) return state

      return {
        likes: {
          ...state.likes,
          [spaceId]: state.likes[spaceId]?.filter(
            l => !(l.entryId === entryId && l.userId === user.id)
          ) || [],
        },
      }
    })
  },

  // Helper functions for components
  hasLiked: (entryId: string) => {
    const { user, likes, currentSpaceId } = get()
    if (!user || !currentSpaceId) return false
    return likes[currentSpaceId]?.some(l => l.entryId === entryId && l.userId === user.id) || false
  },

  getLikeCount: (entryId: string) => {
    const { likes, currentSpaceId } = get()
    if (!currentSpaceId) return 0
    return likes[currentSpaceId]?.filter(l => l.entryId === entryId).length || 0
  },

  getComments: (entryId: string) => {
    const { comments, currentSpaceId } = get()
    if (!currentSpaceId) return []
    return comments[currentSpaceId]?.filter(c => c.entryId === entryId) || []
  },
}))

export const appStore = useAppStore
