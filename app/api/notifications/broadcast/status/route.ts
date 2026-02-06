import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const ADMIN_EMAIL = "fervid2023@gmail.com"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        error: "Missing SUPABASE_SERVICE_ROLE_KEY server env var. Cannot verify broadcast delivery under RLS.",
      },
      { status: 501 },
    )
  }

  const admin = createServiceClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data: profiles, error: profilesError } = await admin.from("profiles").select("id").limit(5000)
  if (profilesError) {
    return NextResponse.json({ error: "Failed to load profiles" }, { status: 500 })
  }

  const profileIds = (profiles || []).map((p: any) => p.id).filter(Boolean)

  const { data: latest, error: latestError } = await admin
    .from("notifications")
    .select("message, created_at")
    .eq("type", "broadcast_test")
    .order("created_at", { ascending: false })
    .limit(1)

  if (latestError) {
    return NextResponse.json({ error: "Failed to query notifications" }, { status: 500 })
  }

  const latestMessage = latest?.[0]?.message || null

  if (!latestMessage) {
    return NextResponse.json({
      ok: true,
      profiles: profileIds.length,
      latestMessage: null,
      haveLatest: 0,
      missingLatest: profileIds.length,
    })
  }

  const { data: matching, error: matchingError } = await admin
    .from("notifications")
    .select("user_id")
    .eq("type", "broadcast_test")
    .eq("message", latestMessage)
    .limit(10000)

  if (matchingError) {
    return NextResponse.json({ error: "Failed to query broadcast deliveries" }, { status: 500 })
  }

  const haveSet = new Set((matching || []).map((r: any) => r.user_id))
  const missing = profileIds.filter((id: string) => !haveSet.has(id))

  return NextResponse.json({
    ok: true,
    profiles: profileIds.length,
    latestMessage,
    haveLatest: haveSet.size,
    missingLatest: missing.length,
    missingUserIdsSample: missing.slice(0, 25),
  })
}
