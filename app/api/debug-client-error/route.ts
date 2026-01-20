import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const debug = {
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    // Check for common charAt error sources
    checks: {
      hasUsername: false,
      hasProfile: false,
      hasEntries: false,
      hasComments: false,
      hasLikes: false,
    }
  }

  return NextResponse.json(debug)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log any client-side errors for debugging
    console.log('🐛 Client Error Debug:', {
      timestamp: new Date().toISOString(),
      error: body.error,
      stack: body.stack,
      url: body.url,
      userAgent: body.userAgent
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Error logged successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to log error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
