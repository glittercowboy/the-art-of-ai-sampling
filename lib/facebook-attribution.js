// ABOUTME: Facebook attribution data capture utility for tracking ad conversions
// ABOUTME: Captures fbclid, cookies, and user data for Facebook CAPI attribution

import { logger } from './logger'

/**
 * Captures Facebook attribution data from the browser
 * This includes fbclid, Facebook cookies, and URL parameters
 * @returns {Object} Attribution data for Facebook CAPI
 */
export function captureFacebookAttribution() {
  const attribution = {
    fbclid: null,
    fbp: null,
    fbc: null,
    userAgent: null,
    sourceUrl: null
  }

  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return attribution
    }

    // Get fbclid from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    attribution.fbclid = urlParams.get('fbclid')

    // Get Facebook cookies
    if (typeof document !== 'undefined' && document.cookie) {
      // Parse all cookies
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        if (cookie) {
          const [key, value] = cookie.trim().split('=')
          if (key && value) {
            acc[key] = value
          }
        }
        return acc
      }, {})

      // Facebook Pixel cookie (_fbp)
      attribution.fbp = cookies._fbp || null

      // Facebook Click ID cookie (_fbc)
      attribution.fbc = cookies._fbc || null
    }

    // Get user agent
    attribution.userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) || null

    // Get source URL (current page)
    attribution.sourceUrl = window.location.href

    // If we have fbclid but no _fbc cookie, create one
    // Format: fb.1.timestamp.fbclid
    if (attribution.fbclid && !attribution.fbc) {
      const timestamp = Math.floor(Date.now() / 1000)
      attribution.fbc = `fb.1.${timestamp}.${attribution.fbclid}`
    }

    logger.dev('📊 Facebook attribution captured:', {
      hasClickId: !!attribution.fbclid,
      hasPixelCookie: !!attribution.fbp,
      hasClickCookie: !!attribution.fbc,
      sourceUrl: attribution.sourceUrl
    })

  } catch (error) {
    logger.devWarn('Failed to capture Facebook attribution:', error.message)
  }

  return attribution
}

/**
 * Stores Facebook attribution data in session storage
 * This persists the data across page navigation during checkout
 * @param {Object} attribution - Attribution data to store
 */
export function storeFacebookAttribution(attribution) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('fb_attribution', JSON.stringify(attribution))
      logger.dev('💾 Facebook attribution stored in session')
    }
  } catch (error) {
    logger.devWarn('Failed to store Facebook attribution:', error.message)
  }
}

/**
 * Retrieves stored Facebook attribution data
 * @returns {Object|null} Stored attribution data or null
 */
export function getStoredFacebookAttribution() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem('fb_attribution')
      if (stored) {
        return JSON.parse(stored)
      }
    }
  } catch (error) {
    logger.devWarn('Failed to retrieve Facebook attribution:', error.message)
  }
  return null
}

/**
 * Merges current and stored attribution data
 * Prefers fresh data but fills in missing values from storage
 * @returns {Object} Complete attribution data
 */
export function getFacebookAttribution() {
  const current = captureFacebookAttribution()
  const stored = getStoredFacebookAttribution()

  if (!stored) {
    return current
  }

  // Merge data, preferring current values when available
  return {
    fbclid: current.fbclid || stored.fbclid,
    fbp: current.fbp || stored.fbp,
    fbc: current.fbc || stored.fbc,
    userAgent: current.userAgent || stored.userAgent,
    sourceUrl: current.sourceUrl || stored.sourceUrl
  }
}

/**
 * Prepares attribution data for sending to the server
 * @returns {Object} Attribution data ready for API calls
 */
export function prepareAttributionPayload() {
  const attribution = getFacebookAttribution()
  
  // Store the attribution data for later use
  storeFacebookAttribution(attribution)

  // Return only non-null values
  const payload = {}
  
  if (attribution.fbclid) payload.fbclid = attribution.fbclid
  if (attribution.fbp) payload.fbp = attribution.fbp
  if (attribution.fbc) payload.fbc = attribution.fbc
  if (attribution.userAgent) payload.userAgent = attribution.userAgent
  if (attribution.sourceUrl) payload.sourceUrl = attribution.sourceUrl

  logger.dev('🚀 Attribution payload prepared:', {
    hasData: Object.keys(payload).length > 0,
    fields: Object.keys(payload)
  })

  return payload
}