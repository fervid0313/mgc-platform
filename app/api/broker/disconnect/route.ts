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
    const { broker } = body

    if (!broker) {
      return NextResponse.json(
        { error: "Missing required field: broker" },
        { status: 400 }
      )
    }

    // Delete linked account
    const { error } = await supabase
      .from("linked_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("broker", broker)

    if (error) {
      console.error("[BROKER] Disconnect error:", error)
      return NextResponse.json(
        { error: "Failed to disconnect broker" },
        { status: 500 }
      )
    }

    // Also clean up pending imported trades for this broker
    await supabase
      .from("imported_trades")
      .delete()
      .eq("user_id", user.id)
      .eq("broker", broker)
      .eq("status", "pending")

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[BROKER] Disconnect error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
