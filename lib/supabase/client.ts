import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[DEBUG] Supabase client config:", {
    url: url ? "present" : "MISSING",
    key: key ? "present" : "MISSING",
    fullUrl: url
  })

  if (!url || !key) {
    console.error("[DEBUG] 🚨 SUPABASE CONFIG MISSING:", { url: !!url, key: !!key })
    throw new Error("Supabase configuration missing")
  }

  const client = createBrowserClient(url, key)

  // Add request interceptor for debugging
  const originalFetch = client.rest.fetch
  client.rest.fetch = async (...args) => {
    console.log("[DEBUG] Supabase API call:", args[0])
    try {
      const result = await originalFetch.apply(client.rest, args)
      console.log("[DEBUG] Supabase response status:", result.status)
      return result
    } catch (error) {
      console.error("[DEBUG] Supabase fetch error:", error)
      throw error
    }
  }

  return client
}
