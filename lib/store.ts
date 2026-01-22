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

  // Debug
  debugJournal: () => Promise<void>
  debugExistingEntries: () => Promise<void>
  debugAllEntries: () => Promise<void>

  lastLoadedProfilesAt: number
  lastLoadedEntriesAt: Record<string, number>

  // Spaces
  spaces: Space[]
  currentSpaceId: string | null
  setCurrentSpace: (spaceId: string) => void
  createSpace: (name: string, description?: string, isPrivate?: boolean) => void
  joinSpace: (spaceId: string) => Promise<void>
  leaveSpace: (spaceId: string) => void
  loadSpaces: () => Promise<void>

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

  // Social Connections
  socialConnections: Record<string, any[]>
  sendConnectionRequest: (requestedId: string) => Promise<boolean>
  acceptConnectionRequest: (requesterId: string) => Promise<boolean>
  declineConnectionRequest: (requesterId: string) => Promise<boolean>
  removeConnection: (connectionId: string) => Promise<boolean>
  loadSocialConnections: () => Promise<void>

  // Space Invite Links
  spaceInviteLinks: any[]
  generateInviteLink: (spaceId: string, message?: string) => Promise<string | null>
  joinSpaceViaInviteLink: (token: string) => Promise<boolean>
  loadSpaceInviteLinks: () => Promise<void>

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
  forceLoadProfiles: () => Promise<void>
  checkForMissingProfiles: () => Promise<{ totalProfiles: number; incompleteProfiles: number; recentProfiles: number } | undefined>

  // Space Members
  getSpaceMembers: (spaceId: string) => UserProfile[]

  getProfile: (userId: string) => UserProfile | undefined
  findUserByTag: (usernameWithTag: string) => Promise<UserProfile | undefined>
  getUsernameFromAuth: (userId: string) => Promise<string | null>

  // Likes only (comments removed)
  likes: Record<string, Like[]>
  loadCommentsAndLikes: (spaceId: string) => Promise<void>
  addLike: (entryId: string) => Promise<void>
  removeLike: (entryId: string) => Promise<void>
  hasLiked: (entryId: string) => boolean
  getLikeCount: (entryId: string) => number
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: () => get().user?.email === ADMIN_EMAIL,

  // Debug function for testing journal functionality
  debugJournal: async () => {
    console.log("🔍 DEBUG: Starting journal functionality test...")
    const state = get()
    
    console.log("📊 Current state:", {
      isAuthenticated: state.isAuthenticated,
      currentSpaceId: state.currentSpaceId,
      userId: state.user?.id,
      username: state.user?.username,
      entriesCount: state.currentSpaceId ? (state.entries[state.currentSpaceId] || []).length : 0
    })

    if (!state.isAuthenticated) {
      console.log("❌ Not authenticated - cannot test journal functionality")
      return
    }

    if (!state.currentSpaceId) {
      console.log("❌ No current space selected")
      return
    }

    try {
      // Test 1: Load entries
      console.log("🔄 Test 1: Loading entries...")
      await state.loadEntries(state.currentSpaceId)
      
      const entries = state.entries[state.currentSpaceId] || []
      console.log("✅ Entries loaded:", entries.length)
      
      // Test 2: Create a test entry
      console.log("📝 Test 2: Creating test entry...")
      const testContent = `Debug test entry at ${new Date().toISOString()}`
      
      await state.addEntry(
        testContent,
        ["debug"],
        "general",
        undefined,
        undefined,
        "calm"
      )
      
      console.log("✅ Test entry created")
      
      // Test 3: Reload entries to verify
      console.log("🔄 Test 3: Reloading entries to verify...")
      await state.forceLoadEntries(state.currentSpaceId)
      
      const newEntries = state.entries[state.currentSpaceId] || []
      console.log("✅ Entries reloaded:", newEntries.length)
      
      const testEntry = newEntries.find(e => e.content.includes("Debug test entry"))
      if (testEntry) {
        console.log("✅ Test entry found:", testEntry.id)
      } else {
        console.log("❌ Test entry not found in reloaded data")
      }
      
      console.log("🎉 DEBUG: Journal functionality test completed")
      
    } catch (error) {
      console.error("💥 DEBUG: Journal functionality test failed:", error)
    }
  },

  // Debug function to check existing entries in database
  debugExistingEntries: async () => {
    console.log("🔍 DEBUG: Checking existing entries in database...")
    const state = get()
    
    if (!state.isAuthenticated) {
      console.log("❌ Not authenticated")
      return
    }

    const supabase = createClient()
    const actualSpaceId = state.currentSpaceId === "space-global" 
      ? "00000000-0000-0000-0000-000000000001" 
      : state.currentSpaceId

    console.log("📊 Checking space:", {
      currentSpaceId: state.currentSpaceId,
      actualSpaceId: actualSpaceId,
      spaceName: state.spaces.find(s => s.id === state.currentSpaceId)?.name
    })

    try {
      // Check all entries in the space
      const { data: allEntries, error: allError } = await supabase
        .from("entries")
        .select("*")
        .eq("space_id", actualSpaceId)

      if (allError) {
        console.error("❌ Error fetching all entries:", allError)
        return
      }

      console.log("✅ All entries in database:", allEntries?.length || 0)
      allEntries?.forEach((entry, index) => {
        console.log(`  ${index + 1}. ID: ${entry.id}, User: ${entry.user_id}, Content: ${entry.content?.substring(0, 50)}..., Created: ${entry.created_at}`)
      })

      // Check entries currently loaded in store
      const storeEntries = state.entries[state.currentSpaceId || ""] || []
      console.log("📊 Entries currently in store:", storeEntries.length)
      storeEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. ID: ${entry.id}, User: ${entry.username}, Content: ${entry.content?.substring(0, 50)}...`)
      })

      // Check for mismatch
      if (allEntries && storeEntries) {
        const dbIds = new Set(allEntries.map(e => e.id))
        const storeIds = new Set(storeEntries.map(e => e.id))
        
        const missingInStore = allEntries.filter(e => !storeIds.has(e.id))
        const extraInStore = storeEntries.filter(e => !dbIds.has(e.id))
        
        if (missingInStore.length > 0) {
          console.log("⚠️ Entries in database but not in store:", missingInStore.length)
          missingInStore.forEach(entry => {
            console.log(`  Missing: ${entry.id} - ${entry.content?.substring(0, 30)}...`)
          })
        }
        
        if (extraInStore.length > 0) {
          console.log("⚠️ Entries in store but not in database:", extraInStore.length)
        }
        
        if (missingInStore.length === 0 && extraInStore.length === 0) {
          console.log("✅ Store and database are in sync")
        }
      }

    } catch (error) {
      console.error("💥 Error checking existing entries:", error)
    }
  },

  // Debug function to check ALL spaces and ALL entries
  debugAllEntries: async () => {
    console.log("🔍 DEBUG: Checking ALL entries across ALL spaces...")
    const state = get()
    
    if (!state.isAuthenticated) {
      console.log("❌ Not authenticated")
      return
    }

    const supabase = createClient()

    try {
      // Get all spaces user has access to
      console.log("📊 Checking all spaces user has access to...")
      const { data: memberships, error: membershipError } = await supabase
        .from("space_members")
        .select("space_id")
        .eq("user_id", state.user!.id)

      if (membershipError) {
        console.error("❌ Error fetching memberships:", membershipError)
        return
      }

      const spaceIds = memberships?.map(m => m.space_id) || []
      console.log("✅ User has access to spaces:", spaceIds.length)

      // Get all entries for all spaces
      let totalEntries = 0
      const entriesBySpace: Record<string, any[]> = {}

      for (const spaceId of spaceIds) {
        const { data: entries, error: entriesError } = await supabase
          .from("entries")
          .select("*")
          .eq("space_id", spaceId)
          .order("created_at", { ascending: false })

        if (entriesError) {
          console.error(`❌ Error fetching entries for space ${spaceId}:`, entriesError)
          continue
        }

        entriesBySpace[spaceId] = entries || []
        totalEntries += (entries || []).length
        
        console.log(`📝 Space ${spaceId}: ${(entries || []).length} entries`)
        ;(entries || []).forEach((entry, index) => {
          console.log(`  ${index + 1}. ID: ${entry.id}, Content: ${entry.content?.substring(0, 50)}..., Created: ${new Date(entry.created_at).toLocaleString()}`)
        })
      }

      console.log(`🎯 Total entries across all spaces: ${totalEntries}`)

      // Also check if there are any entries by this user in the global space
      const globalSpaceId = "00000000-0000-0000-0000-000000000001"
      const { data: globalEntries, error: globalError } = await supabase
        .from("entries")
        .select("*")
        .eq("space_id", globalSpaceId)
        .eq("user_id", state.user!.id)
        .order("created_at", { ascending: false })

      if (globalError) {
        console.error("❌ Error fetching global entries:", globalError)
      } else {
        console.log(`🌍 Global feed entries by you: ${(globalEntries || []).length}`)
        ;(globalEntries || []).forEach((entry, index) => {
          console.log(`  ${index + 1}. ID: ${entry.id}, Content: ${entry.content?.substring(0, 50)}..., Created: ${new Date(entry.created_at).toLocaleString()}`)
        })
      }

      // Check recent entries across all spaces (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: recentEntries, error: recentError } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", state.user!.id)
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false })

      if (recentError) {
        console.error("❌ Error fetching recent entries:", recentError)
      } else {
        console.log(`⏰ Your entries in last 24 hours: ${(recentEntries || []).length}`)
        ;(recentEntries || []).forEach((entry, index) => {
          console.log(`  ${index + 1}. ID: ${entry.id}, Space: ${entry.space_id}, Content: ${entry.content?.substring(0, 50)}...`)
        })
      }

    } catch (error) {
      console.error("💥 Error checking all entries:", error)
    }
  },

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
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    // If profile doesn't exist, create it
    if (profileError && profileError.code === 'PGRST116') {
      console.log("[AUTH] Profile not found, creating for existing user")
      
      const newProfile = {
        id: data.user.id,
        username: email.split("@")[0],
        email: data.user.email!,
        tag: generateTag(),
        // socialLinks: {}, // Remove for now to handle schema issues
      }
      
      const { error: createError } = await supabase
        .from("profiles")
        .insert(newProfile)
      
      if (createError) {
        console.error("[AUTH] Failed to create missing profile:", createError)
        // Continue with fallback data
      } else {
        console.log("[AUTH] ✅ Created missing profile for existing user")
        // Verify the profile was created
        const { data: verifyProfile } = await supabase
          .from("profiles")
          .select("username, tag")
          .eq("id", data.user.id)
          .single()
        
        if (verifyProfile) {
          console.log("[AUTH] ✅ Verified new profile:", verifyProfile.username)
        }
      }
    } else if (profileError) {
      console.error("[AUTH] Profile fetch error:", profileError)
    }

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
      get().loadSocialConnections(),
      get().loadSpaceInviteLinks(),
      get().loadSpaces(),
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
    console.log("[AUTH] Attempting to create profile for user:", data.user.id, "username:", username, "email:", email)
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      username,
      email,
      tag,
      socialLinks: {}, // Add back since schema cache expects it
    })

    console.log("[AUTH] Profile creation result:", { profileError, success: !profileError })
    console.log("[AUTH] Username used in profile creation:", username)

    if (profileError) {
      console.error("[AUTH] Profile creation error:", profileError)
      console.error("[AUTH] Profile creation error details:", {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      })
      
      // Try to check if the user exists in auth
      console.log("[AUTH] Checking if auth user exists...")
      const { data: authUser, error: authError } = await supabase.auth.getUser(data.user.id)
      console.log("[AUTH] Auth user check:", { authUser, authError })
      
      // Try to check current profiles
      console.log("[AUTH] Checking current profiles...")
      const { data: currentProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, email")
        .limit(5)
      console.log("[AUTH] Current profiles:", { currentProfiles, profilesError })
      
      // Try to create profile with fallback data
      const fallbackProfile = {
        id: data.user.id,
        username: username || email.split("@")[0], // Keep the entered username, fallback to email prefix only if empty
        email,
        tag: tag || generateTag(),
        socialLinks: {}, // Add back since schema cache expects it
      }
      
      console.log("[AUTH] Trying fallback profile creation with username:", username, "fallbackProfile:", fallbackProfile)
      const { error: fallbackError } = await supabase
        .from("profiles")
        .upsert(fallbackProfile)
      
      console.log("[AUTH] Fallback creation result:", { fallbackError, success: !fallbackError })
      
      if (fallbackError) {
        console.error("[AUTH] Fallback profile creation failed:", fallbackError)
        console.error("[AUTH] Fallback error details:", {
          message: fallbackError.message,
          details: fallbackError.details,
          hint: fallbackError.hint,
          code: fallbackError.code
        })
        
        // Don't delete the user, just continue with signup
        console.log("[AUTH] ⚠️ Continuing with signup despite profile creation failure")
        // The profile will be created on login/initialization
      } else {
        console.log("[AUTH] ✅ Profile created with fallback data")
      }
    }

    // Verify profile was created successfully
    const { data: verifyProfile, error: verifyError } = await supabase
      .from("profiles")
      .select("id, username, email, tag")
      .eq("id", data.user.id)
      .single()

    if (verifyError || !verifyProfile) {
      console.error("[AUTH] ❌ Profile verification failed:", verifyError)
      // One last attempt with minimal data
      console.log("[AUTH] Final attempt with username:", username)
      const { error: finalError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          username: username, // Use the entered username
          email,
          tag: generateTag(),
          socialLinks: {}, // Add back since schema cache expects it
        })
      
      if (finalError) {
        console.error("[AUTH] ❌ Final profile creation failed:", finalError)
        // Don't fail signup, but log the issue
      } else {
        console.log("[AUTH] ✅ Profile created in final attempt")
      }
    } else {
      console.log("[AUTH] ✅ Profile verified successfully:", verifyProfile.username)
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      username: username, // Use the entered username
      tag,
      createdAt: new Date(),
    }

    console.log("[AUTH] User object created with username:", user.username)

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
      get().forceLoadProfiles(), // Force reload to show new user immediately
      get().loadSocialConnections(),
      get().loadSpaceInviteLinks(),
      get().loadSpaces(),
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
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        console.log("[AUTH] Profile not found during init, creating for existing user")
        
        const newProfile = {
          id: session.user.id,
          username: session.user.email!.split("@")[0],
          email: session.user.email!,
          tag: generateTag(),
          // socialLinks: {}, // Remove for now to handle schema issues
        }
        
        const { error: createError } = await supabase
          .from("profiles")
          .insert(newProfile)
        
        if (createError) {
          console.error("[AUTH] Failed to create missing profile during init:", createError)
          console.error("[AUTH] Init profile creation error details:", {
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
            code: createError.code
          })
          
          // Try to check what's happening with the profiles table
          try {
            const { data: testSelect, error: testError } = await supabase
              .from("profiles")
              .select("count")
              .single()
            
            console.log("[AUTH] Test select result:", testSelect, testError)
          } catch (e) {
            console.error("[AUTH] Test select failed:", e)
          }
          
          // Continue with fallback data
        }
      } else if (profileError) {
        console.error("[AUTH] Profile fetch error during init:", profileError)
      }

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
        get().loadSocialConnections(),
        get().loadSpaceInviteLinks(),
        get().loadSpaces(),
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

    // For private spaces, the creator should automatically see and access it
    // For public spaces, users need to explicitly join to see them
    if (space.isPrivate) {
      console.log("[SPACE] Private space created, adding to creator's spaces list")
      set((state) => ({
        spaces: [...state.spaces, space],
        currentSpaceId: space.id,
      }))
    } else {
      console.log("[SPACE] Public space created, user needs to explicitly join to see it")
      // Don't add public spaces automatically - user needs to join explicitly
    }

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

    console.log("[SPACE] User joined space, loading space details")
    
    // Get space details to add to user's spaces list
    const { data: space } = await supabase
      .from("spaces")
      .select("*")
      .eq("id", spaceId)
      .single()

    if (space) {
      const spaceToAdd: Space = {
        id: space.id,
        name: space.name,
        description: space.description || "",
        ownerId: space.owner_id,
        isPrivate: space.is_private,
        createdAt: new Date(space.created_at),
        memberCount: 1,
      }

      // Add to user's spaces list if not already there
      set((state) => {
        const existingSpace = state.spaces.find(s => s.id === spaceId)
        if (!existingSpace) {
          console.log("[SPACE] Adding space to user's list:", space.name)
          return {
            spaces: [...state.spaces, spaceToAdd],
            currentSpaceId: spaceId,
          }
        } else {
          // Just update member count and switch to space
          console.log("[SPACE] Space already in list, updating count and switching")
          return {
            spaces: state.spaces.map((s) =>
              s.id === spaceId
                ? { ...s, memberCount: s.memberCount + 1 }
                : s
            ),
            currentSpaceId: spaceId,
          }
        }
      })
    }
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
        likes: Object.fromEntries(
          Object.entries(state.likes).filter(([key]) => key !== spaceId)
        ),
      }
    })
  },

  loadSpaces: async () => {
    const { user } = get()
    if (!user) return

    console.log("[SPACES] Loading spaces for user:", user.id)
    const supabase = createClient()
    
    // Always include global space
    const spaces = [globalFeedSpace]
    
    // Only load spaces that the user is an explicit member of (via space_members table)
    console.log("[SPACES] Getting space memberships for user:", user.id)
    const { data: memberships, error: membershipError } = await supabase
      .from("space_members")
      .select("space_id")
      .eq("user_id", user.id)

    console.log("[SPACES] Memberships result:", { memberships, membershipError })

    if (membershipError) {
      console.error("[SPACES] Membership load error:", membershipError)
      console.error("[SPACES] Error details:", {
        message: membershipError.message,
        details: membershipError.details,
        hint: membershipError.hint,
        code: membershipError.code
      })
      // Continue with just global space
      set({ spaces: [globalFeedSpace] })
      return
    }

    // If no memberships (other than global), just return global space
    if (!memberships || memberships.length === 0) {
      console.log("[SPACES] No space memberships found, returning only global")
      set({ spaces: [globalFeedSpace] })
      return
    }

    // Get the space IDs (excluding global space since we handle it separately)
    const spaceIds = memberships
      .map(m => m.space_id)
      .filter(id => id !== "00000000-0000-0000-0000-000000000001")

    if (spaceIds.length === 0) {
      console.log("[SPACES] Only global space membership found")
      set({ spaces: [globalFeedSpace] })
      return
    }

    // Get spaces details for the spaces the user is a member of
    console.log("[SPACES] Loading space details for:", spaceIds)
    const { data: userSpaces, error: spacesError } = await supabase
      .from("spaces")
      .select("*")
      .in("id", spaceIds)

    console.log("[SPACES] Spaces result:", { userSpaces, spacesError })

    if (spacesError) {
      console.error("[SPACES] Spaces load error:", spacesError)
      console.error("[SPACES] Error details:", {
        message: spacesError.message,
        details: spacesError.details,
        hint: spacesError.hint,
        code: spacesError.code
      })
      // Continue with just global space
      set({ spaces: [globalFeedSpace] })
      return
    }

    if (!userSpaces || userSpaces.length === 0) {
      console.log("[SPACES] No space details found")
      set({ spaces: [globalFeedSpace] })
      return
    }

    // Get member counts for each space
    const allSpaceIds = ["00000000-0000-0000-0000-000000000001", ...spaceIds]
    
    const { data: memberCounts, error: countError } = await supabase
      .from("space_members")
      .select("space_id")
      .in("space_id", allSpaceIds)

    if (countError) {
      console.error("[SPACES] Member count error:", countError)
      // Continue without member counts
    }

    // Count members per space
    const counts = memberCounts?.reduce((acc, member) => {
      acc[member.space_id] = (acc[member.space_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Map spaces with member counts and proper ID mapping
    const mappedSpaces = userSpaces.map(space => ({
      ...space,
      id: space.id === "00000000-0000-0000-0000-000000000001" ? "space-global" : space.id,
      isPrivate: space.is_private, // Map snake_case to camelCase
      memberCount: counts[space.id] || 0
    }))

    // Combine global space with user's joined spaces
    const allSpaces = [globalFeedSpace, ...mappedSpaces.filter(s => s.id !== "space-global")]

    console.log("[SPACES] ✅ Loaded spaces:", allSpaces.length, allSpaces.map(s => ({ name: s.name, id: s.id, isPrivate: s.isPrivate })))
    set({ spaces: allSpaces })
  },

  // Entries
  entries: {},
  entriesCursor: {},
  hasMoreEntries: {},
  isLoadingMoreEntries: {},

  // Social Connections
  socialConnections: {},

  // Space Invite Links
  spaceInviteLinks: [],

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
      pnl: profitLoss,
      image,
      mental_state: mentalState,
      user_id: user.id,
    }

    console.log("[ENTRY] 📝 Saving entry:", {
      actualSpaceId,
      hasProfitLoss: profitLoss !== undefined,
      profitLoss,
      hasImage: !!image,
      tradeType,
      mentalState
    })

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

    console.log("[ENTRY] ✅ Entry saved successfully:", {
      savedId: data.id,
      savedPnl: data.pnl,
      savedImage: !!data.image
    })

    const realEntry: JournalEntry = {
      id: data.id,
      spaceId: currentSpaceId,
      userId: data.user_id,
      username: user.username,
      content: data.content,
      tags: data.tags || [],
      tradeType: data.trade_type,
      profitLoss: data.pnl,
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
    
    // Reduced cache time to 500ms for more responsive updates
    if (Date.now() - (lastLoadedEntriesAt[spaceId] || 0) < 500) {
      console.log("[ENTRY] ⏱️ Using cached entries (loaded < 500ms ago)")
      return
    }

    const supabase = createClient()
    const actualSpaceId = spaceId === "space-global" 
      ? "00000000-0000-0000-0000-000000000001" 
      : spaceId

    console.log("[ENTRY] 🔄 Loading entries for space:", spaceId, "→", actualSpaceId)

    try {
      // Simplified query - just get the basic entry data
      const { data: entriesData, error: entriesError } = await supabase
        .from("entries")
        .select(`
          id, 
          space_id, 
          user_id, 
          content, 
          image, 
          pnl,
          tags,
          trade_type,
          mental_state,
          created_at
        `)
        .eq("space_id", actualSpaceId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (entriesError) {
        console.error("[ENTRY] ❌ Failed to load entries:", entriesError)
        console.error("[ENTRY] Error details:", {
          message: entriesError.message,
          code: entriesError.code,
          details: entriesError.details
        })
        
        // Set empty entries on error
        set({
          entries: { ...entries, [spaceId]: [] },
          lastLoadedEntriesAt: { ...lastLoadedEntriesAt, [spaceId]: Date.now() },
        })
        
        // Still load comments/likes (will be empty)
        get().loadCommentsAndLikes(spaceId)
        return
      }

      console.log("[ENTRY] ✅ Raw entries loaded:", entriesData?.length || 0)

      // Map entries safely with better error handling
      const existingProfiles = get().profiles
      const profileMap = existingProfiles.reduce((acc, profile) => {
        acc[profile.id] = profile
        return acc
      }, {} as Record<string, any>)

      const mappedEntries: JournalEntry[] = (entriesData || []).filter(e => e != null).map((e: any): JournalEntry => {
        try {
          const existingProfile = profileMap[e.user_id]
          return {
            id: e.id,
            spaceId,
            userId: e.user_id,
            username: existingProfile?.username || "Loading...", // Use existing profile or fallback
            content: e.content || "",
            tags: Array.isArray(e.tags) ? e.tags : [],
            tradeType: e.trade_type || "general",
            profitLoss: e.pnl !== null && e.pnl !== undefined && e.pnl !== "" ? 
              (() => {
                try {
                  const parsed = parseFloat(e.pnl);
                  return isNaN(parsed) ? undefined : parsed;
                } catch (error) {
                  console.warn("[ENTRY] ⚠️ Invalid pnl value:", e.pnl, error);
                  return undefined;
                }
              })() : undefined,
            image: e.image,
            mentalState: e.mental_state,
            createdAt: new Date(e.created_at),
          };
        } catch (mapError) {
          console.error("[ENTRY] 💥 Error mapping entry:", e, mapError);
          // Return a fallback entry instead of null
          return {
            id: e.id || "unknown",
            spaceId,
            userId: e.user_id || "unknown",
            username: "Error",
            content: "Error loading entry",
            tags: [],
            tradeType: "general",
            profitLoss: undefined,
            image: undefined,
            mentalState: undefined,
            createdAt: new Date(),
          };
        }
      })

      console.log("[ENTRY] ✅ Mapped entries:", mappedEntries.length)

      // Update state with mapped entries
      set({
        entries: { ...entries, [spaceId]: mappedEntries },
        lastLoadedEntriesAt: { ...lastLoadedEntriesAt, [spaceId]: Date.now() },
      })

      // Load profiles separately to update usernames
      const userIds = [...new Set(mappedEntries.map(e => e.userId))]
      if (userIds.length > 0) {
        console.log("[ENTRY] 📝 Loading profiles for users:", userIds)
        
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, tag")
          .in("id", userIds)

        if (profilesError) {
          console.error("[ENTRY] ⚠️ Failed to load profiles:", profilesError)
          // Keep entries with "Loading..." usernames if profiles fail
        } else if (profiles) {
          console.log("[ENTRY] ✅ Profiles loaded:", profiles.length)
          
          const profileMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile
            return acc
          }, {} as Record<string, any>)

          // Update entries with profile data
          const updatedEntries = mappedEntries.map(entry => ({
            ...entry,
            username: profileMap[entry.userId]?.username || "Unknown",
            tag: profileMap[entry.userId]?.tag
          }))

          set({
            entries: { ...entries, [spaceId]: updatedEntries }
          })
          console.log("[ENTRY] ✅ Updated entries with usernames")
          
          // Load comments and likes for the entries
          get().loadCommentsAndLikes(spaceId)
        }
      }

    } catch (err) {
      console.error("[ENTRY] 💥 Unexpected error loading entries:", err)
      set({
        entries: { ...entries, [spaceId]: [] },
        lastLoadedEntriesAt: { ...lastLoadedEntriesAt, [spaceId]: Date.now() },
      })
      
      // Still load comments/likes (will be empty)
      get().loadCommentsAndLikes(spaceId)
    }
  },

  forceLoadEntries: async (spaceId: string) => {
    console.log("[ENTRY] 🔄 Force loading entries (bypassing cache)")
    const { lastLoadedEntriesAt, entries } = get()
    
    console.log("[ENTRY] 📊 Before force load:", {
      spaceId,
      currentEntriesCount: entries[spaceId]?.length || 0,
      lastLoadedAt: lastLoadedEntriesAt[spaceId] || 0,
      timeSinceLoad: Date.now() - (lastLoadedEntriesAt[spaceId] || 0)
    })
    
    // Clear the cache timestamp to force reload
    set({
      lastLoadedEntriesAt: { ...lastLoadedEntriesAt, [spaceId]: 0 }
    })
    
    // Call loadEntries which will now reload from database
    await get().loadEntries(spaceId)
    
    // Log after load
    const { entries: newEntries } = get()
    console.log("[ENTRY] 📊 After force load:", {
      spaceId,
      newEntriesCount: newEntries[spaceId]?.length || 0,
      sampleEntry: newEntries[spaceId]?.[0] ? {
        id: newEntries[spaceId][0].id,
        hasPnl: newEntries[spaceId][0].profitLoss !== undefined,
        pnlValue: newEntries[spaceId][0].profitLoss,
        hasImage: !!newEntries[spaceId][0].image
      } : 'No entries'
    })
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
    const mappedEntries = newEntries.filter(e => e != null).map((e: any) => {
      return {
        id: e.id,
        spaceId,
        userId: e.user_id,
        username: e.username || "Unknown",
        content: e.content,
        tags: e.tags || [],
        tradeType: e.trade_type,
        profitLoss: (e.pnl !== null && e.pnl !== undefined && e.pnl !== '') ? 
              (() => {
                try {
                  return parseFloat(e.pnl);
                } catch (error) {
                  console.warn("[ENTRY] ⚠️ Invalid pnl value in loadMore:", e.pnl, error);
                  return undefined;
                }
              })() : undefined,
        image: e.image,
        mentalState: e.mental_state,
        createdAt: new Date(e.created_at),
      }
    })

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

    // First, try to get all profiles
    console.log("[PROFILES] Loading all profiles...")
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

    const mappedProfiles = (profilesData || []).filter(p => p != null).map((p: any) => {
      console.log("[PROFILES] Mapping profile:", { id: p.id, username: p.username, email: p.email })
      
      return {
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
      }
    })

    console.log("[PROFILES] Raw data from DB:", profilesData?.slice(0, 3))
    console.log("[PROFILES] Total profiles loaded:", profilesData?.length || 0)
    console.log("[PROFILES] Mapped profiles:", mappedProfiles.slice(0, 3))
    console.log("[PROFILES] Total mapped profiles:", mappedProfiles.length)
    console.log("[PROFILES] Profiles with missing username:", mappedProfiles.filter(p => !p.username || p.username === "Unknown"))
    console.log("[PROFILES] All profile IDs and usernames:", mappedProfiles.map(p => ({ id: p.id, username: p.username })))

    set({ profiles: mappedProfiles, lastLoadedProfilesAt: Date.now() })

    // Backfill usernames in entries after profiles load
    const currentEntries = get().entries
    const updatedEntries = Object.entries(currentEntries).reduce((acc, [spaceId, spaceEntries]) => {
      const entriesWithUsernames = spaceEntries.map(entry => {
        if (!entry.username || entry.username === "Unknown") {
          const profile = mappedProfiles.find(p => p.id === entry.userId)
          if (profile) {
            console.log("[PROFILES] Backfilling username for entry:", entry.id, "with:", profile.username)
            return { ...entry, username: profile.username, tag: profile.tag }
          }
        }
        return entry
      })
      acc[spaceId] = entriesWithUsernames
      return acc
    }, {} as Record<string, JournalEntry[]>)

    set({ entries: updatedEntries })
    console.log("[PROFILES] ✅ Loaded and processed", mappedProfiles.length, "profiles")
    
    // Additional pass: Update any remaining "Unknown" usernames
    const { entries, currentSpaceId } = get()
    if (currentSpaceId && entries[currentSpaceId]) {
      const stillUnknown = entries[currentSpaceId].filter(e => e.username === "Unknown" || e.username === "Loading...")
      if (stillUnknown.length > 0) {
        console.log("[PROFILES] 🔄 Found", stillUnknown.length, "entries still with unknown usernames, updating...")
        
        const finalUpdatedEntries = entries[currentSpaceId].map(entry => {
          const profile = mappedProfiles.find(p => p.id === entry.userId)
          if (profile && (entry.username === "Unknown" || entry.username === "Loading...")) {
            return { ...entry, username: profile.username }
          }
          return entry
        })
        
        set({
          entries: {
            ...entries,
            [currentSpaceId]: finalUpdatedEntries
          }
        })
        console.log("[PROFILES] ✅ Updated remaining unknown usernames")
      }
    }
  },

  getUsernameFromAuth: async (userId: string) => {
    const supabase = createClient()
    try {
      const { data: authUser, error } = await supabase.auth.admin.getUserById(userId)
      if (error || !authUser) {
        console.error("[AUTH] Error getting user from auth:", error)
        return null
      }
      return authUser.user.user_metadata?.username || null
    } catch (error) {
      console.error("[AUTH] Error in getUsernameFromAuth:", error)
      return null
    }
  },

  forceLoadProfiles: async () => {
    console.log("[PROFILES] Force loading profiles (bypassing cache)")
    // Reset cache timestamp to force reload
    set({ lastLoadedProfilesAt: 0 })
    await get().loadProfiles()
  },

  checkForMissingProfiles: async () => {
    console.log("[PROFILES] Checking for users without profiles...")
    const supabase = createClient()
    
    // Get current profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, username, created_at")
      .order("created_at", { ascending: false })
    
    if (profilesError) {
      console.error("[PROFILES] Error checking profiles:", profilesError)
      return
    }
    
    console.log(`[PROFILES] Currently have ${profiles?.length || 0} profiles`)
    
    // Log recent profiles for verification
    const recentProfiles = profiles?.slice(0, 5) || []
    console.log("[PROFILES] Recent profiles:", recentProfiles.map(p => ({
      username: p.username,
      email: p.email,
      created: p.created_at
    })))
    
    // Check for any profiles with missing data
    const incompleteProfiles = profiles?.filter(p => !p.username || p.username === "Unknown") || []
    if (incompleteProfiles.length > 0) {
      console.warn("[PROFILES] Found incomplete profiles:", incompleteProfiles)
    }
    
    return {
      totalProfiles: profiles?.length || 0,
      incompleteProfiles: incompleteProfiles.length,
      recentProfiles: recentProfiles.length
    }
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

  // Comments and Likes
  comments: {},
  likes: {},

  loadCommentsAndLikes: async (spaceId: string) => {
    const supabase = createClient()
    const actualSpaceId = spaceId === "space-global" 
      ? "00000000-0000-0000-0000-000000000001" 
      : spaceId

    console.log("[LIKES] Loading for space:", spaceId, "→", actualSpaceId)
    console.log("[LIKES] Entry IDs:", Object.values(get().entries[spaceId] || []).map(e => e.id))

    // Only load likes (comments removed)
    const likesResult = await supabase
      .from("likes")
      .select("*")
      .in("entry_id", 
        Object.values(get().entries[spaceId] || []).map(e => e.id)
      )

    const likes = (likesResult.data || []).filter(l => l != null).map((l: any) => ({
      id: l.id,
      entryId: l.entry_id,
      userId: l.user_id,
      createdAt: new Date(l.created_at),
    }))

    console.log("[LIKES] Loaded likes:", likes.length, likes)

    set({
      likes: { ...get().likes, [spaceId]: likes },
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
        user_id: user.id,
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

  // Social Connections
  sendConnectionRequest: async (requestedId: string) => {
    const { user } = get()
    if (!user || !user.id) {
      console.log("[CONNECTION] No user found, cannot send request")
      return false
    }

    console.log("[CONNECTION] Sending connection request:")
    console.log("  From user ID:", user.id)
    console.log("  To user ID:", requestedId)

    const supabase = createClient()
    const { data, error } = await supabase
      .from("social_connections")
      .insert({
        requester_id: user.id,
        requested_id: requestedId,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[CONNECTION] Send request error:", error)
      console.error("  Error details:", error.message)
      return false
    }

    console.log("[CONNECTION] ✅ Connection request sent successfully!")
    console.log("  Created connection:", data)
    return true
  },

  acceptConnectionRequest: async (requesterId: string) => {
    const { user } = get()
    if (!user || !user.id) {
      console.log("[CONNECTION] No user found, cannot accept request")
      return false
    }

    console.log("[CONNECTION] Accepting connection request:")
    console.log("  From user ID:", requesterId)
    console.log("  To user ID:", user.id)

    const supabase = createClient()
    const { data, error } = await supabase
      .from("social_connections")
      .update({ status: "accepted" })
      .eq("requester_id", requesterId)
      .eq("requested_id", user.id)
      .eq("status", "pending")
      .select()
      .single()

    if (error) {
      console.error("[CONNECTION] Accept request error:", error)
      console.error("  Error details:", error.message)
      return false
    }

    console.log("[CONNECTION] ✅ Connection request accepted!")
    console.log("  Updated connection:", data)
    
    // Reload connections after accepting
    await get().loadSocialConnections()
    return true
  },

  declineConnectionRequest: async (requesterId: string) => {
    const { user } = get()
    if (!user || !user.id) return false

    const supabase = createClient()
    const { error } = await supabase
      .from("social_connections")
      .update({ status: "declined" })
      .eq("requester_id", requesterId)
      .eq("requested_id", user.id)
      .eq("status", "pending")

    if (error) {
      console.error("[CONNECTION] Decline request error:", error)
      return false
    }

    console.log("[CONNECTION] ✅ Connection request declined")
    return true
  },

  removeConnection: async (connectionId: string) => {
    const { user } = get()
    if (!user || !user.id) return false

    const supabase = createClient()
    const { error } = await supabase
      .from("social_connections")
      .delete()
      .or(`(requester_id.eq.${user.id},requested_id.eq.${connectionId}),(requester_id.eq.${connectionId},requested_id.eq.${user.id})`)

    if (error) {
      console.error("[CONNECTION] Remove connection error:", error)
      return false
    }

    console.log("[CONNECTION] ✅ Connection removed")
    return true
  },

  loadSocialConnections: async () => {
    const { user } = get()
    if (!user || !user.id) {
      console.log("[CONNECTION] No user found, skipping load")
      return
    }

    console.log("[CONNECTION] Loading connections for user:", user.id)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("social_connections")
      .select("*")
      .or(`requester_id.eq.${user.id},status.eq.accepted`)
      .or(`requested_id.eq.${user.id},status.eq.accepted`)

    if (error) {
      console.error("[CONNECTION] Load connections error:", error)
      return
    }

    const connections = data || []
    console.log("[CONNECTION] ✅ Loaded connections:", connections.length, connections)
    console.log("[CONNECTION] Sample connection:", connections[0])

    set({ socialConnections: { [user.id]: connections } })
    console.log("[CONNECTION] ✅ Stored in state:", { [user.id]: connections })
  },

  // Space Invite Links
  generateInviteLink: async (spaceId: string, message?: string) => {
    const { user } = get()
    if (!user || !user.id) {
      console.log("[INVITE_LINK] No user found, skipping link generation")
      return null
    }

    console.log("[INVITE_LINK] Generating link for space:", spaceId)
    const supabase = createClient()
    
    // Generate secure token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    const { error } = await supabase
      .from("space_invite_links")
      .insert({
        space_id: spaceId,
        creator_id: user.id,
        token,
        email: "shared-link", // Placeholder for shared links
        message,
      })

    if (error) {
      console.error("[INVITE_LINK] Generate error:", error)
      return null
    }

    const inviteLink = `${window.location.origin}/invite/${token}`
    console.log("[INVITE_LINK] ✅ Link generated:", inviteLink)
    
    await get().loadSpaceInviteLinks()
    return inviteLink
  },

  joinSpaceViaInviteLink: async (token: string) => {
    const { user } = get()
    if (!user || !user.id) {
      console.log("[INVITE_LINK] No user found, skipping join")
      return false
    }

    console.log("[INVITE_LINK] Joining via token:", token)
    const supabase = createClient()
    
    // Call the database function
    const { data, error } = await supabase
      .rpc('join_space_via_invite_link', {
        p_token: token,
        p_user_id: user.id
      })

    if (error || !data) {
      console.error("[INVITE_LINK] Join error:", error)
      return false
    }

    console.log("[INVITE_LINK] ✅ Successfully joined space")
    await get().loadProfiles()
    
    // For private spaces, we need to manually add them to the spaces list
    // since loadSpaces() won't load private spaces the user didn't create
    const { data: inviteLink } = await supabase
      .from("space_invite_links")
      .select("space_id")
      .eq("token", token)
      .single()
    
    if (inviteLink?.space_id) {
      const { data: joinedSpace } = await supabase
        .from("spaces")
        .select("*")
        .eq("id", inviteLink.space_id)
        .single()
      
      if (joinedSpace && joinedSpace.is_private) {
        // Add the private space to the list
        set((state) => ({
          spaces: [...state.spaces, {
            ...joinedSpace,
            id: joinedSpace.id === "00000000-0000-0000-0000-000000000001" ? "space-global" : joinedSpace.id,
            memberCount: state.spaces.find(s => s.id === joinedSpace.id)?.memberCount || 1
          }]
        }))
      }
    }
    
    return true
  },

  loadSpaceInviteLinks: async () => {
    const { user } = get()
    if (!user || !user.id) {
      console.log("[INVITE_LINK] No user found, skipping load")
      return
    }

    console.log("[INVITE_LINK] Loading invite links for user:", user.id)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("space_invite_links")
      .select(`
        *,
        spaces:space_id (
          id,
          name,
          description
        )
      `)
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[INVITE_LINK] Load error:", error)
      return
    }

    const inviteLinks = data || [];
    console.log("[INVITE_LINK] ✅ Loaded invite links:", inviteLinks.length, inviteLinks);

    set({ spaceInviteLinks: inviteLinks });
  },
}))

export const appStore = useAppStore;
