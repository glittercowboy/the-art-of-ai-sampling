/**
 * Test: Stripe webhook handler
 * This test ensures webhook processing, signature verification, and integrations work
 */

import { createMocks } from 'node-mocks-http'
import handler from '../pages/api/stripe-webhook'

// Mock all dependencies
jest.mock('../lib/stripe')
jest.mock('../lib/facebook')
jest.mock('../lib/ghl')
jest.mock('../middleware/raw-body')

// Import mocked modules
import stripe from '../lib/stripe'
import { sendPurchaseEvent } from '../lib/facebook'
import { sendWebhook } from '../lib/ghl'
import getRawBody from '../middleware/raw-body'

// Get the mocked functions
const mockStripe = stripe
const mockSendPurchaseEvent = sendPurchaseEvent
const mockSendWebhook = sendWebhook
const mockGetRawBody = getRawBody

describe('/api/stripe-webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
    
    // Setup mock implementations
    mockStripe.webhooks = {
      constructEvent: jest.fn()
    }
    mockGetRawBody.mockImplementation((req) => Promise.resolve(req.body))
  })

  test('should only accept POST method', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Method not allowed')
  })

  test('should verify webhook signature', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'stripe-signature': 'invalid_signature'
      },
      body: 'raw_body'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Webhook signature verification failed')
  })

  test('should handle payment_intent.succeeded event', async () => {

    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 9800,
          currency: 'usd',
          metadata: {
            email: 'test@example.com',
            name: 'Test User',
            product: 'The Art of AI Sampling Course'
          }
        }
      }
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
    mockSendPurchaseEvent.mockResolvedValue({ success: true })
    mockSendWebhook.mockResolvedValue({ success: true })

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature'
      },
      body: 'raw_body'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    
    // Should call Facebook CAPI
    expect(mockSendPurchaseEvent).toHaveBeenCalledWith({
      email: 'test@example.com',
      paymentId: 'pi_test_123',
      value: 98.00,
      currency: 'USD'
    })

    // Should call GHL webhook
    expect(mockSendWebhook).toHaveBeenCalledWith({
      email: 'test@example.com',
      name: 'Test User',
      product: 'The Art of AI Sampling Course',
      paymentId: 'pi_test_123',
      amount: 98.00
    })
  })

  test('should ignore non-payment events', async () => {
    const mockEvent = {
      type: 'customer.created',
      data: { object: {} }
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature'
      },
      body: 'raw_body'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    
    // Should not call integrations for irrelevant events
    expect(mockSendPurchaseEvent).not.toHaveBeenCalled()
    expect(mockSendWebhook).not.toHaveBeenCalled()
  })

  test('should handle Facebook CAPI errors gracefully', async () => {
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 9800,
          currency: 'usd',
          metadata: {
            email: 'test@example.com',
            name: 'Test User',
            product: 'The Art of AI Sampling Course'
          }
        }
      }
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
    mockSendPurchaseEvent.mockRejectedValue(new Error('Facebook API error'))
    mockSendWebhook.mockResolvedValue({ success: true })

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature'
      },
      body: 'raw_body'
    })

    await handler(req, res)

    // Should still return 200 even if Facebook fails
    expect(res._getStatusCode()).toBe(200)
    
    // GHL should still be called
    expect(mockSendWebhook).toHaveBeenCalled()
  })

  test('should handle GHL webhook errors gracefully', async () => {
    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 9800,
          currency: 'usd',
          metadata: {
            email: 'test@example.com',
            name: 'Test User',
            product: 'The Art of AI Sampling Course'
          }
        }
      }
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
    mockSendPurchaseEvent.mockResolvedValue({ success: true })
    mockSendWebhook.mockRejectedValue(new Error('GHL API error'))

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'stripe-signature': 'valid_signature'
      },
      body: 'raw_body'
    })

    await handler(req, res)

    // Should still return 200 even if GHL fails
    expect(res._getStatusCode()).toBe(200)
    
    // Facebook should still be called
    expect(mockSendPurchaseEvent).toHaveBeenCalled()
  })
})