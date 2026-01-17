import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()

    // Test 1: Check auth
    const { data: authData, error: authError } = await supabase.auth.getUser()

    // Test 2: Check profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    // Test 3: Check entries table
    const { data: entriesData, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .limit(1)

    // Test 4: Check if we can insert (without actually inserting)
    const testInsertData = {
      space_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      user_id: authData.user?.id || '00000000-0000-0000-0000-000000000000',
      username: 'test_user',
      content: 'test entry',
      tags: [],
      trade_type: 'general',
      mental_state: 'calm'
    }

    const { error: insertError } = await supabase
      .from('entries')
      .insert(testInsertData)
      .select()
      .single()

    return NextResponse.json({
      success: true,
      auth: {
        user: authData.user?.email || null,
        error: authError?.message || null
      },
      profiles: {
        accessible: !profilesError,
        error: profilesError?.message || null,
        code: profilesError?.code || null
      },
      entries: {
        accessible: !entriesError,
        error: entriesError?.message || null,
        code: entriesError?.code || null,
        data: entriesData ? 'Has data' : 'No data'
      },
      insertTest: {
        wouldWork: !insertError,
        error: insertError?.message || null,
        code: insertError?.code || null
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}