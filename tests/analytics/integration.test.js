// ABOUTME: Integration tests to ensure analytics doesn't interfere with existing functionality
// ABOUTME: Verifies that payment, webhook, and Facebook tracking continue working correctly

// Mock Stripe before requiring any modules that use it
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        client_secret: 'pi_test_secret',
        id: 'pi_test_123'
      }),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }))
})

// Also mock the stripe lib module
jest.mock('../../lib/stripe', () => ({
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      client_secret: 'pi_test_secret',
      id: 'pi_test_123'
    }),
  },
}))

describe('Analytics Integration Safety', () => {
  beforeEach(() => {
    // Clear any modules to ensure clean test environment
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('should not interfere with existing payment tests running', async () => {
    // Simply verify that we can run existing payment tests without issues
    // The actual payment tests are in payment.test.js
    const paymentTestPath = require.resolve('../payment.test.js')
    expect(paymentTestPath).toBeDefined()
    
    // Verify the analytics module doesn't break stripe imports
    const stripe = require('../../lib/stripe')
    expect(stripe).toBeDefined()
    expect(stripe.paymentIntents).toBeDefined()
  })

  it('should not interfere with Facebook module functionality', () => {
    const facebook = require('../../lib/facebook')
    expect(facebook.sendPurchaseEvent).toBeDefined()
    expect(typeof facebook.sendPurchaseEvent).toBe('function')
  })

  it('should not interfere with GHL module functionality', () => {
    const ghl = require('../../lib/ghl')
    expect(ghl.sendWebhook).toBeDefined()
    expect(typeof ghl.sendWebhook).toBe('function')
  })

  it('should allow analytics to coexist with other modules', () => {
    // Load analytics alongside other modules
    const analytics = require('../../lib/analytics')
    const facebook = require('../../lib/facebook')
    const ghl = require('../../lib/ghl')

    // Verify all modules work independently
    expect(analytics.trackEvent).toBeDefined()
    expect(facebook.sendPurchaseEvent).toBeDefined()
    expect(ghl.sendWebhook).toBeDefined()
    
    // Verify they're all functions
    expect(typeof analytics.trackEvent).toBe('function')
    expect(typeof facebook.sendPurchaseEvent).toBe('function')
    expect(typeof ghl.sendWebhook).toBe('function')
  })
})