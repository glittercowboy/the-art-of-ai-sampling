// ABOUTME: GoHighLevel (GHL) webhook integration for course access provisioning
// ABOUTME: Sends purchase data to GHL for automated course enrollment

import { retryWithBackoff } from './retry'

export async function sendWebhook({ email, name, product, paymentId, amount }) {
  if (!process.env.GHL_WEBHOOK_URL) {
    throw new Error('GHL_WEBHOOK_URL not configured in environment variables')
  }

  const webhookData = {
    email,
    name,
    product,
    paymentId,
    amount,
    currency: 'USD',
    source: 'stripe',
    timestamp: new Date().toISOString()
  }

  return await retryWithBackoff(async () => {
    const response = await fetch(process.env.GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`GHL webhook error (${response.status}): ${errorText}`)
    }

    return await response.json().catch(() => ({ success: true }))
  }, 3, 1000) // 3 retries with 1 second base delay
}