import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { broker, username, password, environment } = body

    if (!broker || !username || !password) {
      return NextResponse.json(
        { error: "Missing required fields: broker, username, password" },
        { status: 400 }
      )
    }

    if (!["tradovate", "projectx"].includes(broker)) {
      return NextResponse.json(
        { error: "Invalid broker. Supported: tradovate, projectx" },
        { status: 400 }
      )
    }

    // Upsert linked account
    const { data, error } = await supabase
      .from("linked_accounts")
      .upsert(
        {
          user_id: user.id,
          broker,
          credentials: { username, password },
          environment: environment || "demo",
          is_active: true,
        },
        { onConflict: "user_id,broker" }
      )
      .select()
      .single()

    if (error) {
      console.error("[BROKER] Connect error:", error)
      return NextResponse.json(
        { error: "Failed to save broker connection" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      account: {
        id: data.id,
        broker: data.broker,
        environment: data.environment,
        isActive: data.is_active,
        lastSyncedAt: data.last_synced_at,
      },
    })
  } catch (err: any) {
    console.error("[BROKER] Connect error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
