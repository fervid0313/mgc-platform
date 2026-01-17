/**
 * Check if Supabase is properly configured and connected
 * This is a diagnostic utility to verify Supabase setup
 */

export function checkSupabaseConfig(): {
  isConfigured: boolean
  hasUrl: boolean
  hasKey: boolean
  errors: string[]
} {
  const errors: string[] = []
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const hasUrl = !!url && url.trim() !== ""
  const hasKey = !!key && key.trim() !== ""

  if (!hasUrl) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is not set or is empty")
  }

  if (!hasKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or is empty")
  }

  if (hasUrl && !url.startsWith("http")) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL appears to be invalid (should start with http:// or https://)")
  }

  const isConfigured = hasUrl && hasKey && errors.length === 0

  return {
    isConfigured,
    hasUrl,
    hasKey,
    errors,
  }
}

/**
 * Test Supabase connection by making a simple query
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean
  error?: string
  details?: string
}> {
  try {
    const config = checkSupabaseConfig()

    if (!config.isConfigured) {
      return {
        success: false,
        error: "Supabase not configured",
        details: config.errors.join(", "),
      }
    }

    // Dynamic import to avoid SSR issues
    const { createClient } = await import("./client")
    const supabase = createClient()

    // Try a simple query to test connection
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      return {
        success: false,
        error: "Connection failed",
        details: `Database query error: ${error.message}. This could mean: 1) Tables don't exist yet (run migration scripts), 2) RLS policies are blocking access, 3) Network/connection issue`,
      }
    }

    return {
      success: true,
      details: "Supabase connection successful! Database is accessible.",
    }
  } catch (error: any) {
    return {
      success: false,
      error: "Connection test failed",
      details: error.message || "Unknown error occurred",
    }
  }
}
