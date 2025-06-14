// ABOUTME: API endpoint for collecting analytics events from the client
// ABOUTME: Validates and stores pageview, click, scroll, and engagement events

import { logger } from '../../../lib/logger'

const VALID_EVENT_TYPES = ['pageview', 'click', 'scroll', 'engagement', 'lead_capture', 'checkout_form_shown', 'checkout_abandoned']
const REQUIRED_FIELDS = ['event_type', 'session_id']

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { body } = req
  logger.dev('📊 Analytics event received:', logger.sanitize(body))

  // Check for valid request body
  if (body === null || body === undefined) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  // Validate required fields - body could be array or non-object
  if (typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid request body' })
  }
  
  const missingFields = REQUIRED_FIELDS.filter(field => !body[field])
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(', ')}`
    })
  }

  // Validate event_type
  if (!VALID_EVENT_TYPES.includes(body.event_type)) {
    return res.status(400).json({
      error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`
    })
  }

  try {
    // Import storage functions
    const { incrementCounter, setSessionData, getCounter, setCounter, addUnique } = require('../../../lib/analytics-storage')
    
    const { event_type, session_id, timestamp, data } = body
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    logger.dev(`📊 Processing ${event_type} event`)

    // Store different event types
    switch (event_type) {
      case 'pageview':
        await incrementCounter('analytics:pageviews:total')
        await incrementCounter(`analytics:pageviews:${today}`)
        logger.dev('📈 Pageview counters incremented')
        break
        
      case 'click':
        await incrementCounter('analytics:clicks:total')
        await incrementCounter(`analytics:clicks:${today}`)
        logger.dev('👆 Click counters incremented')
        break
        
      case 'scroll':
        if (data?.depth) {
          await incrementCounter(`analytics:scroll:${data.depth}`)
          logger.dev(`📜 Scroll depth ${data.depth}% incremented`)
        }
        break
        
      case 'engagement':
        if (data?.duration) {
          // For engagement, we need to add the duration to a running total
          // Since incrementCounter only increments by 1, we'll store individual sessions
          await incrementCounter('analytics:engagement:count')
          // Store the duration in a separate key for later calculation
          const currentTotal = await getCounter('analytics:engagement:total_ms') || 0
          await setCounter('analytics:engagement:total_ms', currentTotal + data.duration)
          logger.dev(`⏱️ Engagement time added: ${data.duration}ms`)
        }
        break
        
      case 'lead_capture':
        await incrementCounter('analytics:leads:total')
        await incrementCounter(`analytics:leads:${today}`)
        logger.dev('📧 Lead capture counters incremented')
        break
        
      case 'checkout_form_shown':
        await incrementCounter('analytics:checkout_forms:total')
        await incrementCounter(`analytics:checkout_forms:${today}`)
        logger.dev('💳 Checkout form counters incremented')
        break
        
      case 'checkout_abandoned':
        await incrementCounter('analytics:abandoned:total')
        await incrementCounter(`analytics:abandoned:${today}`)
        logger.dev('🚪 Checkout abandonment tracked')
        break
    }

    // Store session data for unique visitor tracking
    if (session_id) {
      await setSessionData(session_id, {
        first_seen: timestamp,
        last_event: event_type,
        last_timestamp: timestamp
      })
      
      // Track unique visitor in persistent set
      await addUnique('analytics:visitors:unique', session_id)
      
      // Track unique visitor by day
      await addUnique(`analytics:visitors:unique:${today}`, session_id)
    }

    logger.dev(`✅ Successfully stored ${event_type} event`)
    return res.status(200).json({ success: true })
    
  } catch (error) {
    logger.error('❌ Error storing analytics event:', error.message)
    return res.status(500).json({ 
      error: 'Failed to store analytics event',
      details: error.message 
    })
  }
}