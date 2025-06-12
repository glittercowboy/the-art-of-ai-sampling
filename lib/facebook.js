// ABOUTME: Facebook Conversions API (CAPI) integration for server-side tracking
// ABOUTME: Sends Purchase events to Facebook for ad conversion optimization

import { retryWithBackoff } from './retry'
import { logger } from './logger'

export async function sendPurchaseEvent({ email, paymentId, value, currency, attribution = {} }) {
  if (!process.env.FACEBOOK_ACCESS_TOKEN || !process.env.FACEBOOK_PIXEL_ID) {
    throw new Error('Facebook environment variables not configured')
  }

  const url = `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PIXEL_ID}/events`
  
  // Hash email for privacy (Facebook requires SHA-256)
  const crypto = await import('crypto')
  const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')

  // Build user data with attribution information
  const userData = {
    em: [hashedEmail], // hashed email
  }

  // Add Facebook browser ID if available
  if (attribution.fbp) {
    userData.fbp = attribution.fbp
  }

  // Add Facebook click ID if available
  if (attribution.fbc) {
    userData.fbc = attribution.fbc
  }

  // Add user IP if available (for better matching)
  if (attribution.userIp) {
    userData.client_ip_address = attribution.userIp
  }

  // Add user agent if available (for better matching)
  if (attribution.userAgent) {
    userData.client_user_agent = attribution.userAgent
  }

  const eventData = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: attribution.sourceUrl || 'https://taches.ai',
      user_data: userData,
      custom_data: {
        currency: currency,
        value: value,
        content_name: 'The Art of AI Sampling Course',
        content_type: 'product'
      },
      event_id: paymentId // Use payment ID for deduplication
    }],
    test_event_code: process.env.FACEBOOK_TEST_CODE || undefined
  }

  // Log the attribution data being sent (without sensitive info)
  logger.info('📤 Sending Facebook CAPI event with attribution:', {
    eventName: 'Purchase',
    eventId: paymentId,
    value: value,
    currency: currency,
    hasEmail: !!hashedEmail,
    hasFbp: !!attribution.fbp,
    hasFbc: !!attribution.fbc,
    hasIp: !!attribution.userIp,
    hasUserAgent: !!attribution.userAgent,
    sourceUrl: attribution.sourceUrl || 'https://taches.ai',
    testMode: !!process.env.FACEBOOK_TEST_CODE
  })

  return await retryWithBackoff(async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FACEBOOK_ACCESS_TOKEN}`
      },
      body: JSON.stringify(eventData)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      logger.error(`Facebook CAPI error (${response.status}):`, error)
      throw new Error(`Facebook CAPI error (${response.status}): ${JSON.stringify(error)}`)
    }

    const result = await response.json()
    
    // Log successful submission
    logger.info('✅ Facebook CAPI event sent successfully:', {
      eventId: paymentId,
      eventsReceived: result.events_received || 0,
      messages: result.messages || [],
      fbTraceId: result.fb_trace_id || 'N/A'
    })

    return result
  }, 3, 1000) // 3 retries with 1 second base delay
}