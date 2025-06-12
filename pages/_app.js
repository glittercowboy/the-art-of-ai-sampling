// ABOUTME: Next.js App component wrapper for global settings and providers
// ABOUTME: Handles global CSS imports, Facebook attribution capture, and page initialization

import { useEffect } from 'react'
import '../styles/globals.css'
import { captureFacebookAttribution, storeFacebookAttribution } from '../lib/facebook-attribution'
import { logger } from '../lib/logger'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Capture and store Facebook attribution data on initial load
    try {
      const attribution = captureFacebookAttribution()
      
      // Only store if we have meaningful attribution data
      if (attribution.fbclid || attribution.fbp || attribution.fbc) {
        storeFacebookAttribution(attribution)
        logger.dev('🎯 Facebook attribution captured on page load:', {
          hasClickId: !!attribution.fbclid,
          hasPixelCookie: !!attribution.fbp,
          hasClickCookie: !!attribution.fbc
        })
      }
    } catch (error) {
      logger.devWarn('Failed to capture initial attribution:', error.message)
    }
  }, []) // Run once on mount

  return <Component {...pageProps} />
}