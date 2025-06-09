// ABOUTME: Local webhook testing script for Stripe integration
// ABOUTME: Simulates a Stripe webhook payload to test the endpoint locally

const crypto = require('crypto')

// Mock Stripe webhook payload
const mockPaymentIntent = {
  id: 'pi_test_1234567890',
  object: 'payment_intent',
  amount: 9800, // $98.00 in cents
  currency: 'usd',
  status: 'succeeded',
  metadata: {
    email: 'test@example.com',
    name: 'Test Customer',
    product: 'The Art of AI Sampling Course'
  }
}

const webhookEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: mockPaymentIntent
  },
  created: Math.floor(Date.now() / 1000)
}

const payload = JSON.stringify(webhookEvent, null, 2)

console.log('Mock Stripe Webhook Payload:')
console.log('=' .repeat(50))
console.log(payload)
console.log('=' .repeat(50))

console.log('\nTo test locally:')
console.log('1. Start your Next.js dev server: npm run dev')
console.log('2. Use this payload to POST to: http://localhost:3000/api/stripe-webhook')
console.log('3. Add proper Stripe-Signature header for signature verification')

console.log('\nFor real testing with Stripe CLI:')
console.log('stripe listen --forward-to localhost:3000/api/stripe-webhook')
console.log('stripe trigger payment_intent.succeeded')

module.exports = { mockPaymentIntent, webhookEvent }