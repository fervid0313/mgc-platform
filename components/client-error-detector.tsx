'use client'

import { useEffect } from 'react'

export function ClientErrorDetector() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Detect charAt errors specifically
      if (event.message.includes('charAt') || event.message.includes('null')) {
        console.log('🔨 CharAt error detected:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        })

        // Send to debug endpoint
        fetch('/api/debug-client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: event.message,
            stack: event.error?.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          })
        }).catch(() => {
          // Silently fail if debug endpoint fails
        })
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('charAt') || event.reason?.message?.includes('null')) {
        console.log('🔨 Unhandled charAt error detected:', event.reason)
        
        fetch('/api/debug-client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: event.reason?.message || 'Unknown promise rejection',
            stack: event.reason?.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            type: 'unhandledRejection'
          })
        }).catch(() => {
          // Silently fail if debug endpoint fails
        })
      }
    }

    // Add error listeners
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
