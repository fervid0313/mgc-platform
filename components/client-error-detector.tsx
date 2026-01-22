'use client'

import { useEffect } from 'react'

export function ClientErrorDetector() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Suppress charAt errors completely
      if (event.message.includes('charAt') || event.message.includes('Cannot read properties of null')) {
        console.log('🔧 Suppressed charAt/null error:', event.message)
        return // Don't send to debug endpoint
      }

      // Log all other errors for debugging
      console.log('🔨 Client error detected:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      })

      // Send error to debug endpoint
      fetch('/api/debug-client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: event.message,
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }),
      }).catch(() => {
        // Silently fail if debug endpoint fails
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Suppress charAt errors completely
      if (event.reason?.message?.includes('charAt') || event.reason?.message?.includes('Cannot read properties of null')) {
        console.log('🔧 Suppressed unhandled charAt/null error:', event.reason?.message)
        return // Don't send to debug endpoint
      }

      console.log('🔨 Unhandled promise rejection detected:', event.reason)
      
      // Send rejection to debug endpoint
      fetch('/api/debug-client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: event.reason?.message || 'Unknown promise rejection',
          stack: event.reason?.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }),
      }).catch(() => {
        // Silently fail if debug endpoint fails
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
