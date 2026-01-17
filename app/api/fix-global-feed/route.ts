import { createClient } from "@/lib/supabase/client"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createClient()
    
    // First, ensure the Global Feed space exists and is marked as public
    const { data: spaceData, error: spaceError } = await supabase
      .from("spaces")
      .upsert({
        id: "00000000-0000-0000-0000-000000000001",
        name: "Global Feed",
        description: "Public space for the entire MGS community",
        owner_id: "00000000-0000-0000-0000-000000000000", // Use NULL UUID as system owner
        is_private: false,
        is_public_group: true,
        created_at: new Date().toISOString(),
        member_count: 9999
      })
      .select()
      .single()

    if (spaceError) {
      console.error("Space upsert error:", spaceError)
      return NextResponse.json({ error: spaceError.message }, { status: 500 })
    }

    console.log("Global Feed space ensured:", spaceData)

    // Get all profiles to add them as members
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    console.log("Found profiles:", profiles?.length || 0)

    // Add all users as members of Global Feed space
    if (profiles && profiles.length > 0) {
      const memberInserts = profiles.map(profile => ({
        space_id: "00000000-0000-0000-0000-000000000001",
        user_id: profile.id
      }))

      const { data: memberData, error: memberError } = await supabase
        .from("space_members")
        .upsert(memberInserts, { onConflict: "space_id,user_id" })
        .select()

      if (memberError) {
        console.error("Member upsert error:", memberError)
        return NextResponse.json({ error: memberError.message }, { status: 500 })
      }

      console.log("Added members:", memberData?.length || 0)
    }

    // Verify the fix
    const { data: verifySpace, error: verifySpaceError } = await supabase
      .from("spaces")
      .select("id, name, is_private, is_public_group")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single()

    const { data: verifyMembers, error: verifyMembersError } = await supabase
      .from("space_members")
      .select("count")
      .eq("space_id", "00000000-0000-0000-0000-000000000001")

    return NextResponse.json({
      success: true,
      space: verifySpace,
      memberCount: verifyMembers?.length || 0,
      errors: { verifySpaceError, verifyMembersError }
    })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
