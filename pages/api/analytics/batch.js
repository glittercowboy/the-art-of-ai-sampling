// ABOUTME: Batch analytics API endpoint for processing multiple events efficiently
// ABOUTME: Handles validation, aggregation, and storage of batched analytics events

import { batchIncrement, setSession, addUnique, incrementCounter } from '../../../lib/analytics-storage'
import { logger } from '../../../lib/logger'

const MAX_BATCH_SIZE = 100
const SESSION_TTL = 1800 // 30 minutes

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate request body
    const { events } = req.body
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid request body' })
    }

    if (events.length === 0) {
      return res.status(400).json({ error: 'No events to process' })
    }

    if (events.length > MAX_BATCH_SIZE) {
      return res.status(400).json({ error: `Batch size exceeds limit (${MAX_BATCH_SIZE})` })
    }

    // Process events
    const results = await processBatchEvents(events)

    // Return summary
    res.status(200).json({
      success: true,
      processed: results.processed,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined
    })

  } catch (error) {
    logger.error('Batch analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function processBatchEvents(events) {
  const results = {
    processed: 0,
    failed: 0,
    errors: []
  }

  // Group events by type for efficient processing
  const eventGroups = {
    pageviews: [],
    clicks: [],
    scrolls: [],
    forms: [],
    engagement: [],
    errors: [],
    other: []
  }

  // Validate and group events
  for (const event of events) {
    try {
      // Validate required fields
      if (!event.eventId || !event.eventName || !event.timestamp || !event.sessionId) {
        results.failed++
        results.errors.push({
          eventId: event.eventId || 'unknown',
          error: 'Missing required fields'
        })
        continue
      }

      // Group by type
      switch (event.eventName) {
        case 'page_view':
          eventGroups.pageviews.push(event)
          break
        case 'click':
          eventGroups.clicks.push(event)
          break
        case 'scroll_depth':
          eventGroups.scrolls.push(event)
          break
        case 'form_start':
        case 'form_field_complete':
        case 'form_submit':
        case 'form_abandon':
          eventGroups.forms.push(event)
          break
        case 'engagement_time':
          eventGroups.engagement.push(event)
          break
        case 'error':
          eventGroups.errors.push(event)
          break
        default:
          eventGroups.other.push(event)
      }
    } catch (error) {
      results.failed++
      results.errors.push({
        eventId: event.eventId || 'unknown',
        error: error.message
      })
    }
  }

  // Process each group
  try {
    // Aggregate counters
    const counters = {}
    const today = new Date().toISOString().split('T')[0]
    
    // Process pageviews
    if (eventGroups.pageviews.length > 0) {
      counters['analytics:pageviews:total'] = eventGroups.pageviews.length
      counters[`analytics:pageviews:${today}`] = eventGroups.pageviews.length
      
      // Track UTM campaigns
      for (const event of eventGroups.pageviews) {
        if (event.properties?.utm_campaign) {
          const campaign = event.properties.utm_campaign
          counters[`analytics:campaigns:${campaign}:views`] = 
            (counters[`analytics:campaigns:${campaign}:views`] || 0) + 1
        }
      }
    }

    // Process clicks
    if (eventGroups.clicks.length > 0) {
      counters['analytics:clicks:total'] = eventGroups.clicks.length
      counters[`analytics:clicks:${today}`] = eventGroups.clicks.length
      
      // Track specific click actions
      for (const event of eventGroups.clicks) {
        const action = event.properties?.action || 'generic'
        counters[`analytics:clicks:${action}`] = 
          (counters[`analytics:clicks:${action}`] || 0) + 1
          
        // Special handling for checkout clicks
        if (action === 'checkout_click') {
          counters['analytics:checkout_forms:total'] = 
            (counters['analytics:checkout_forms:total'] || 0) + 1
          counters[`analytics:checkout_forms:${today}`] = 
            (counters[`analytics:checkout_forms:${today}`] || 0) + 1
        }
      }
    }

    // Process scroll events
    for (const event of eventGroups.scrolls) {
      const depth = event.properties?.depth
      if (depth) {
        counters[`analytics:scroll:${depth}`] = 
          (counters[`analytics:scroll:${depth}`] || 0) + 1
      }
    }

    // Process form events
    for (const event of eventGroups.forms) {
      switch (event.eventName) {
        case 'form_start':
          counters['analytics:forms:started'] = 
            (counters['analytics:forms:started'] || 0) + 1
          break
        case 'form_submit':
          counters['analytics:forms:completed'] = 
            (counters['analytics:forms:completed'] || 0) + 1
          counters['analytics:leads:total'] = 
            (counters['analytics:leads:total'] || 0) + 1
          counters[`analytics:leads:${today}`] = 
            (counters[`analytics:leads:${today}`] || 0) + 1
          break
        case 'form_abandon':
          counters['analytics:abandoned:total'] = 
            (counters['analytics:abandoned:total'] || 0) + 1
          counters[`analytics:abandoned:${today}`] = 
            (counters[`analytics:abandoned:${today}`] || 0) + 1
          break
      }
    }

    // Process engagement time
    for (const event of eventGroups.engagement) {
      const duration = event.properties?.duration || 0
      if (duration > 0) {
        await incrementCounter('analytics:engagement:total_ms', duration * 1000)
        await incrementCounter('analytics:engagement:count')
      }
    }

    // Process errors
    if (eventGroups.errors.length > 0) {
      counters['analytics:errors:total'] = eventGroups.errors.length
      counters[`analytics:errors:${today}`] = eventGroups.errors.length
    }

    // Batch increment all counters
    if (Object.keys(counters).length > 0) {
      await batchIncrement(counters)
    }

    // Track unique sessions
    const uniqueSessions = new Set()
    for (const event of events) {
      if (event.sessionId && !uniqueSessions.has(event.sessionId)) {
        uniqueSessions.add(event.sessionId)
        
        // Store session data
        await setSession(
          `analytics:session:${event.sessionId}`,
          {
            firstSeen: event.timestamp,
            lastSeen: event.timestamp,
            events: 1
          },
          SESSION_TTL
        )
        
        // Track unique visitor
        await addUnique('analytics:visitors:unique', event.sessionId)
      }
    }

    // Count successful events
    results.processed = events.length - results.failed

  } catch (error) {
    logger.error('Batch processing error:', error)
    // If batch processing fails, try to process individually
    for (const event of events) {
      try {
        await processSingleEvent(event)
        results.processed++
      } catch (err) {
        results.failed++
        results.errors.push({
          eventId: event.eventId,
          error: err.message
        })
      }
    }
  }

  return results
}

// Fallback for individual event processing
async function processSingleEvent(event) {
  const today = new Date().toISOString().split('T')[0]
  
  switch (event.eventName) {
    case 'page_view':
      await incrementCounter('analytics:pageviews:total')
      await incrementCounter(`analytics:pageviews:${today}`)
      break
    case 'click':
      await incrementCounter('analytics:clicks:total')
      await incrementCounter(`analytics:clicks:${today}`)
      break
    // Add other event types as needed
  }
}