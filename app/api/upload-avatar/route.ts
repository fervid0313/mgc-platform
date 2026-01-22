import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    console.log('[AVATAR API] Upload request received')
    
    const { userId, avatar } = await request.json()
    console.log('[AVATAR API] Request data:', { userId: userId?.substring(0, 8) + '...', avatarLength: avatar?.length })

    if (!userId || !avatar) {
      console.error('[AVATAR API] Missing data:', { hasUserId: !!userId, hasAvatar: !!avatar })
      return NextResponse.json({ error: 'Missing userId or avatar' }, { status: 400 })
    }

    // Validate avatar is a valid base64 image
    if (!avatar.startsWith('data:image/')) {
      console.error('[AVATAR API] Invalid avatar format')
      return NextResponse.json({ error: 'Invalid avatar format' }, { status: 400 })
    }

    // Check avatar size (base64 string should be reasonable)
    const avatarSizeInBytes = Math.floor((avatar.length * 3) / 4)
    if (avatarSizeInBytes > 5 * 1024 * 1024) { // 5MB limit
      console.error('[AVATAR API] Avatar too large:', avatarSizeInBytes)
      return NextResponse.json({ error: 'Avatar too large (max 5MB)' }, { status: 400 })
    }

    // Use the same client pattern as the rest of the app
    const supabase = createClient()
    console.log('[AVATAR API] Supabase client created')

    // Update the user's profile with the new avatar
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar })
      .eq('id', userId)
      .select()

    console.log('[AVATAR API] Update result:', { data, error })

    if (error) {
      console.error('[AVATAR API] Database update error:', error)
      // If it's a permission error, we might need to handle it differently
      if (error.code === '42501') {
        return NextResponse.json({ 
          error: 'Permission denied. You may need to update your own profile.', 
          code: error.code 
        }, { status: 403 })
      }
      return NextResponse.json({ 
        error: 'Failed to update avatar', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }

    console.log('[AVATAR API] Avatar updated successfully')
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[AVATAR API] Upload error:', error)
    // Ensure we always return JSON, even in catch blocks
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
