// ABOUTME: Stripe webhook handler for processing successful payments
// ABOUTME: Handles signature verification, Facebook CAPI events, and GHL integration

import stripe from '../../lib/stripe'
import { sendPurchaseEvent } from '../../lib/facebook'
import { sendWebhook } from '../../lib/ghl'
import getRawBody from '../../middleware/raw-body'
import { logger } from '../../lib/logger'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  // Handle payment_intent.succeeded event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object

    try {
      // Extract customer data from payment intent metadata
      const customerData = {
        email: paymentIntent.metadata.email,
        name: paymentIntent.metadata.name,
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert cents to dollars
        currency: paymentIntent.currency.toUpperCase()
      }

      // Send Facebook CAPI Purchase event (non-blocking)
      try {
        await sendPurchaseEvent({
          email: customerData.email,
          paymentId: customerData.paymentId,
          value: customerData.amount,
          currency: customerData.currency
        })
        logger.info('Facebook CAPI Purchase event sent successfully')
      } catch (fbError) {
        logger.error('Facebook CAPI error:', fbError.message)
        // Continue processing even if Facebook fails
      }

      // Send GHL webhook for course access (non-blocking)
      try {
        await sendWebhook({
          email: customerData.email,
          name: customerData.name,
          product: paymentIntent.metadata.product,
          paymentId: customerData.paymentId,
          amount: customerData.amount
        })
        logger.info('GHL webhook sent successfully')
      } catch (ghlError) {
        logger.error('GHL webhook error:', ghlError.message)
        // Continue processing even if GHL fails
      }

    } catch (error) {
      logger.error('Error processing payment webhook:', error.message)
      // Still return 200 to acknowledge receipt to Stripe
    }
  }

  // Always return 200 to acknowledge receipt
  res.status(200).json({ received: true })
}

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}