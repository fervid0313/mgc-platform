import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('[SYNC-PROFILES] Starting profile sync...')
    
    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[SYNC-PROFILES] SUPABASE_SERVICE_ROLE_KEY not found')
      return Response.json({ 
        error: 'Service role key not configured', 
        message: 'Please set SUPABASE_SERVICE_ROLE_KEY environment variable',
        alternative: 'Use manual SQL script to create missing profiles'
      }, { status: 500 })
    }
    
    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get all auth users (requires service role)
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('[SYNC-PROFILES] Error getting auth users:', authError)
      return Response.json({ 
        error: 'Failed to get auth users', 
        details: authError.message 
      }, { status: 500 })
    }
    
    console.log(`[SYNC-PROFILES] Found ${authUsers.users.length} auth users`)
    
    // Get existing profiles
    const { data: existingProfiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
    
    if (profileError) {
      console.error('[SYNC-PROFILES] Error getting existing profiles:', profileError)
      return Response.json({ 
        error: 'Failed to get existing profiles', 
        details: profileError.message 
      }, { status: 500 })
    }
    
    const existingEmails = new Set(existingProfiles?.map(p => p.email) || [])
    const existingIds = new Set(existingProfiles?.map(p => p.id) || [])
    
    // Find users missing profiles
    const missingProfiles = authUsers.users.filter(user => 
      !existingEmails.has(user.email || '') && 
      !existingIds.has(user.id)
    )
    
    console.log(`[SYNC-PROFILES] Found ${missingProfiles.length} users missing profiles`)
    
    const results = []
    
    // Create missing profiles
    for (const user of missingProfiles) {
      const newProfile = {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown',
        email: user.email || '',
        tag: user.user_metadata?.tag || Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        socialLinks: {}
      }
      
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(newProfile)
      
      if (insertError) {
        console.error(`[SYNC-PROFILES] Failed to create profile for ${user.email}:`, insertError)
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: insertError.message
        })
      } else {
        console.log(`[SYNC-PROFILES] ✅ Created profile for ${user.email}`)
        results.push({
          userId: user.id,
          email: user.email,
          username: newProfile.username,
          success: true
        })
      }
    }
    
    return Response.json({
      success: true,
      totalAuthUsers: authUsers.users.length,
      existingProfiles: existingProfiles?.length || 0,
      missingProfiles: missingProfiles.length,
      createdProfiles: results.filter(r => r.success).length,
      results
    })
    
  } catch (error) {
    console.error('[SYNC-PROFILES] Unexpected error:', error)
    return Response.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
