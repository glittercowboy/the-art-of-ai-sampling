// ABOUTME: Client-side analytics tracking library for capturing user behavior
// ABOUTME: Handles pageviews, clicks, scroll depth, and engagement time tracking

import { logger } from './logger'

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
 * Extract UTM parameters from URL
 */
function getUtmParameters() {
  if (typeof window === 'undefined') return {}
  
  const urlParams = new URLSearchParams(window.location.search)
  const utmParams = {}
  
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  utmKeys.forEach(key => {
    const value = urlParams.get(key)
    if (value) {
      utmParams[key] = value
    }
  })
  
  return utmParams
}

/**
 * Get viewport dimensions
 */
function getViewport() {
  if (typeof window === 'undefined') return {}
  
  return {
    width: window.innerWidth || 0,
    height: window.innerHeight || 0
  }
}

/**
 * Send analytics event to API
 * @param {string} eventType - Type of event
 * @param {object} data - Event data
 */
async function trackEvent(eventType, data = {}) {
  try {
    logger.dev(`📊 Tracking ${eventType} event:`, logger.sanitize(data))
    
    // Merge event data with UTM parameters and viewport for pageviews
    const eventData = { ...data }
    
    if (eventType === 'pageview') {
      const utmParams = getUtmParameters()
      const viewport = getViewport()
      
      Object.assign(eventData, utmParams)
      if (viewport.width && viewport.height) {
        eventData.viewport = viewport
      }
    }
    
    const payload = {
      event_type: eventType,
      timestamp: Date.now(),
      session_id: getSessionId(),
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      data: eventData
    }

    logger.dev('📤 Sending payload:', logger.sanitize(payload))

    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      logger.devWarn('❌ Analytics tracking failed:', response.status)
      const errorText = await response.text()
      logger.devWarn('Response:', errorText)
    } else {
      logger.dev('✅ Analytics event sent successfully')
    }
  } catch (error) {
    logger.devWarn('❌ Analytics tracking error:', error.message)
  }
}

// Debouncing variables
let lastClickTime = 0
const DEBOUNCE_DELAY = 500

// Scroll tracking variables
let lastScrollTime = 0
let trackedScrollMilestones = new Set()
const SCROLL_THROTTLE_DELAY = 1000
let scrollHandler = null

// Time tracking variables
let startTime = 0
let totalEngagementTime = 0
let isPageVisible = true
let lastVisibilityChange = 0

/**
 * Reset tracking state (for testing)
 */
function resetTracking() {
  lastClickTime = 0
  lastScrollTime = 0
  trackedScrollMilestones.clear()
  sessionId = null
  startTime = 0
  totalEngagementTime = 0
  isPageVisible = true
  lastVisibilityChange = 0
  
  // Remove event listeners if they exist
  if (typeof window !== 'undefined' && scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
  }
}

/**
 * Set up click tracking for specific elements
 */
function setupClickTracking() {
  if (typeof document === 'undefined') return

  // Track clicks on checkout buttons
  const handleClick = async (event) => {
    const element = event.target
    
    // Check if this is a tracked element
    if (element.classList.contains('checkout-button') || 
        element.id === 'checkout-btn' ||
        element.textContent?.includes('Start Course') ||
        element.textContent?.includes('$97')) {
      
      // Debounce rapid clicks
      const now = Date.now()
      if (now - lastClickTime < DEBOUNCE_DELAY) {
        return
      }
      lastClickTime = now
      
      await trackEvent('click', {
        element: 'checkout-button',
        element_text: element.textContent?.trim() || '',
        element_id: element.id || '',
        element_class: element.className || '',
        coordinates: {
          x: event.clientX || 0,
          y: event.clientY || 0
        }
      })
    }
  }

  // Add click listener to document (event delegation)
  document.addEventListener('click', handleClick)
}

/**
 * Calculate scroll depth percentage
 */
function getScrollDepth() {
  if (typeof window === 'undefined') return 0
  
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
  const clientHeight = document.documentElement.clientHeight || window.innerHeight
  
  const scrollableHeight = scrollHeight - clientHeight
  if (scrollableHeight <= 0) return 100
  
  const scrollPercent = Math.round((scrollTop / scrollableHeight) * 100)
  return Math.min(scrollPercent, 100)
}

/**
 * Get scroll milestone (25, 50, 75, 100)
 */
function getScrollMilestone(depth) {
  if (depth >= 100) return 100
  if (depth >= 75) return 75
  if (depth >= 50) return 50
  if (depth >= 25) return 25
  return null
}

/**
 * Set up scroll depth tracking
 */
function setupScrollTracking() {
  if (typeof window === 'undefined') return

  scrollHandler = async () => {
    // Throttle scroll events
    const now = Date.now()
    if (now - lastScrollTime < SCROLL_THROTTLE_DELAY) {
      return
    }
    lastScrollTime = now
    
    const scrollDepth = getScrollDepth()
    const milestone = getScrollMilestone(scrollDepth)
    
    // Only track milestones and only once per milestone
    if (milestone && !trackedScrollMilestones.has(milestone)) {
      trackedScrollMilestones.add(milestone)
      
      await trackEvent('scroll', {
        depth: milestone,
        actual_depth: scrollDepth
      })
    }
  }

  // Remove existing listener if any
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
  
  // Add scroll listener
  window.addEventListener('scroll', scrollHandler)
}

/**
 * Get current timestamp
 */
function getCurrentTime() {
  return Date.now()
}

/**
 * Start time tracking
 */
function startTimeTracking() {
  if (typeof window === 'undefined') return
  
  startTime = getCurrentTime()
  lastVisibilityChange = startTime
  isPageVisible = typeof document !== 'undefined' ? !document.hidden : true
}

/**
 * Calculate current engagement time
 */
function getEngagementTime() {
  if (!startTime) return 0
  
  const now = getCurrentTime()
  let currentSessionTime = 0
  
  if (isPageVisible) {
    // Page is currently visible, add time since last visibility change
    currentSessionTime = now - lastVisibilityChange
  }
  
  return totalEngagementTime + currentSessionTime
}

/**
 * Handle page visibility changes
 */
function handleVisibilityChange() {
  if (typeof document === 'undefined') return
  
  const now = getCurrentTime()
  const wasVisible = isPageVisible
  isPageVisible = !document.hidden
  
  if (wasVisible && !isPageVisible) {
    // Page became hidden - add time to total
    totalEngagementTime += now - lastVisibilityChange
  } else if (!wasVisible && isPageVisible) {
    // Page became visible - reset last change time
    lastVisibilityChange = now
  }
}

/**
 * Set up time tracking with Page Visibility API
 */
function setupTimeTracking() {
  if (typeof window === 'undefined') return
  
  // Start tracking
  startTimeTracking()
  
  // Listen for visibility changes
  if (typeof document !== 'undefined' && 'hidden' in document) {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
  
  // Send engagement time on page unload
  const handleUnload = async () => {
    const duration = getEngagementTime()
    if (duration > 0) {
      // Use sendBeacon for reliable delivery on unload, fallback to fetch
      const payload = JSON.stringify({
        event_type: 'engagement',
        timestamp: getCurrentTime(),
        session_id: getSessionId(),
        page_url: window.location?.href || '',
        referrer: document?.referrer || '',
        data: { duration }
      })
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', payload)
      } else {
        // Fallback to fetch (though less reliable on unload)
        await trackEvent('engagement', { duration })
      }
    }
  }
  
  window.addEventListener('beforeunload', handleUnload)
}

/**
 * Initialize analytics tracking
 */
async function init() {
  if (typeof window === 'undefined') return

  logger.dev('🚀 Initializing analytics tracking...')
  
  // Track initial pageview
  try {
    await trackEvent('pageview')
    logger.dev('✅ Pageview tracked successfully')
  } catch (error) {
    logger.error('❌ Failed to track pageview:', error.message)
  }
  
  // Set up click tracking
  setupClickTracking()
  logger.dev('👆 Click tracking enabled')
  
  // Set up scroll tracking
  setupScrollTracking()
  logger.dev('📜 Scroll tracking enabled')
  
  // Set up time tracking
  setupTimeTracking()
  logger.dev('⏱️ Time tracking enabled')
  
  logger.dev('🎯 Analytics tracking fully initialized')
}

// Export for ES6 modules (browser/Next.js)
export {
  init,
  trackEvent,
  getSessionId,
  setupClickTracking,
  setupScrollTracking,
  setupTimeTracking,
  getScrollDepth,
  getScrollMilestone,
  getEngagementTime,
  resetTracking
}

// Export for CommonJS (Node.js/tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    trackEvent,
    getSessionId,
    setupClickTracking,
    setupScrollTracking,
    setupTimeTracking,
    getScrollDepth,
    getScrollMilestone,
    getEngagementTime,
    resetTracking
  }
}