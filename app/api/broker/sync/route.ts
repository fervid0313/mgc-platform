import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Both Tradovate and Project X use CSV import
    // (Tradovate API requires a paid $25/mo developer subscription)
    return NextResponse.json(
      { error: "Use CSV import to sync trades. Export your trade history from your platform and upload the CSV file." },
      { status: 400 }
    )
  } catch (err: any) {
    console.error("[BROKER] Sync error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
