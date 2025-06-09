// ABOUTME: Facebook Conversions API (CAPI) integration for server-side tracking
// ABOUTME: Sends Purchase events to Facebook for ad conversion optimization

import { retryWithBackoff } from './retry'

export async function sendPurchaseEvent({ email, paymentId, value, currency }) {
  if (!process.env.FACEBOOK_ACCESS_TOKEN || !process.env.FACEBOOK_PIXEL_ID) {
    throw new Error('Facebook environment variables not configured')
  }

  const url = `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PIXEL_ID}/events`
  
  // Hash email for privacy (Facebook requires SHA-256)
  const crypto = await import('crypto')
  const hashedEmail = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')

  const eventData = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: 'https://taches.ai',
      user_data: {
        em: [hashedEmail], // hashed email
      },
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
      throw new Error(`Facebook CAPI error (${response.status}): ${JSON.stringify(error)}`)
    }

    return await response.json()
  }, 3, 1000) // 3 retries with 1 second base delay
}