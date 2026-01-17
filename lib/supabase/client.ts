import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[DEBUG] Supabase client config:", {
    url: url ? "present" : "MISSING",
    key: key ? "present" : "MISSING",
    fullUrl: url
  })

  // Expose config and test function for browser debugging
  if (typeof window !== 'undefined') {
    (window as any).supabaseConfig = { url, key: key ? "present" : "MISSING", fullUrl: url }

    // Add test function
    ;(window as any).testSupabaseConnection = async () => {
      console.log("🧪 Testing Supabase connection...")

      try {
        // Test 1: Basic query
        const { data: profilesData, error: profilesError } = await client
          .from('profiles')
          .select('count')
          .limit(1)

        console.log("✅ Profiles query:", { data: profilesData, error: profilesError })

        // Test 2: Check if entries table exists
        const { data: entriesData, error: entriesError } = await client
          .from('entries')
          .select('*')
          .limit(1)

        console.log("✅ Entries table check:", {
          data: entriesData,
          error: entriesError,
          tableExists: !entriesError || entriesError.code !== '42P01'
        })

        // Test 3: Auth status
        const { data: authData } = await client.auth.getUser()
        console.log("✅ Auth status:", {
          user: authData.user?.id || 'Not logged in',
          email: authData.user?.email
        })

        return { profiles: { data: profilesData, error: profilesError }, entries: { data: entriesData, error: entriesError }, auth: authData }

      } catch (error) {
        console.error("❌ Connection test failed:", error)
        return { error }
      }
    }
  }

  if (!url || !key) {
    console.error("[DEBUG] 🚨 SUPABASE CONFIG MISSING:", { url: !!url, key: !!key })
    throw new Error("Supabase configuration missing")
  }

  const client = createBrowserClient(url, key)

  // Note: Debugging interceptor temporarily disabled due to TypeScript errors
  // TODO: Fix this with proper type-safe approach if needed
  /*
  const originalFetch = client.rest.fetch
  client.rest.fetch = async (...args) => {
    console.log("[DEBUG] Supabase API call:", args[0])
    try {
      const result = await originalFetch.apply(client.rest, args)
      console.log("[DEBUG] Supabase response status:", result.status, result.statusText)

      // Check if response is HTML instead of JSON
      const contentType = result.headers.get('content-type')
      if (contentType && contentType.includes('text/html')) {
        console.warn("[DEBUG] Received HTML response instead of JSON - possible routing issue")
      }

      return result
    } catch (error) {
      console.error("[DEBUG] Supabase API error:", error)
      throw error
    }
  }
  */

  return client
}
