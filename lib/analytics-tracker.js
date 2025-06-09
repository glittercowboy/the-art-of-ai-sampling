// ABOUTME: Client-side analytics tracking library for capturing user behavior
// ABOUTME: Handles pageviews, clicks, scroll depth, and engagement time tracking

let sessionId = null

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

/**
 * Get or create session ID from sessionStorage
 */
function getSessionId() {
  if (sessionId) return sessionId
  
  if (typeof window !== 'undefined' && window.sessionStorage) {
    sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = generateSessionId()
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
  } else {
    // Fallback for non-browser environments
    sessionId = generateSessionId()
  }
  
  return sessionId
}

/**
 * Send analytics event to API
 * @param {string} eventType - Type of event
 * @param {object} data - Event data
 */
async function trackEvent(eventType, data = {}) {
  try {
    const payload = {
      event_type: eventType,
      timestamp: Date.now(),
      session_id: getSessionId(),
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      data
    }

    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.warn('Analytics tracking failed:', response.status)
    }
  } catch (error) {
    console.warn('Analytics tracking error:', error)
  }
}

/**
 * Initialize analytics tracking
 */
async function init() {
  // Track initial pageview
  await trackEvent('pageview')
}

module.exports = {
  init,
  trackEvent,
  getSessionId
}