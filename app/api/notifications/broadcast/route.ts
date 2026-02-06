import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAIL = "fervid2023@gmail.com"

export async function POST(request: Request) {
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

  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id").limit(2000)

  if (profilesError) {
    return NextResponse.json({ error: "Failed to load profiles" }, { status: 500 })
  }

  const ids = (profiles || []).map((p: any) => p.id).filter(Boolean)

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 })
  }

  let body: any = null
  try {
    body = await request.json()
  } catch {
    body = null
  }

  const title = typeof body?.title === "string" ? body.title.trim() : ""
  const customMessage = typeof body?.message === "string" ? body.message.trim() : ""

  const isCustom = title.length > 0 && customMessage.length > 0

  const now = new Date()
  const stamp = now.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  const type = isCustom ? "admin_global" : "broadcast_test"
  const message = isCustom ? JSON.stringify({ title, message: customMessage }) : `MGS test notification (${stamp})`

  const rows = ids.map((id: string) => ({
    user_id: id,
    from_user_id: user.id,
    type,
    target_entry_id: null,
    target_entry_content: null,
    message,
    read: false,
  }))

  const { error: insertError } = await supabase.from("notifications").insert(rows)

  if (insertError) {
    return NextResponse.json({ error: "Failed to insert notifications" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, inserted: rows.length })
}
