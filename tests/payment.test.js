/**
 * Test: Payment Intent API endpoint
 * This test ensures payment intent creation works correctly
 */

import { createMocks } from 'node-mocks-http'
import handler from '../pages/api/create-payment-intent'
import stripe from '../lib/stripe'

// Mock Stripe
jest.mock('../lib/stripe', () => ({
  paymentIntents: {
    create: jest.fn()
  }
}))

// Mock sale-config
jest.mock('../lib/sale-config', () => ({
  getCurrentPricing: jest.fn()
}))

import { getCurrentPricing } from '../lib/sale-config'

describe('/api/create-payment-intent', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Default to regular pricing
    getCurrentPricing.mockReturnValue({
      price: 97,
      stripePriceId: 'price_1RXnr4Gk1M5Eg2svb9riyGQv',
      isOnSale: false,
      sale: null
    })
  })

  test('should create payment intent with regular pricing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })

    // Mock Stripe payment intent creation
    stripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_456',
      amount: 9700,
      currency: 'usd'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('clientSecret')
    expect(data.clientSecret).toBe('pi_test_123_secret_456')

    // Verify Stripe was called with correct parameters
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 9700, // $97.00 in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        email: 'test@example.com',
        name: 'Test User',
        product: 'The Art of AI Sampling Course',
        price_paid: '97',
        stripe_price_id: 'price_1RXnr4Gk1M5Eg2svb9riyGQv',
        is_on_sale: 'false'
      }
    })
  })

  test('should create payment intent with sale pricing', async () => {
    // Mock sale pricing
    getCurrentPricing.mockReturnValue({
      price: 47,
      originalPrice: 97,
      stripePriceId: 'price_1RYWXJGk1M5Eg2svgJntoCRs',
      savings: 50,
      isOnSale: true,
      sale: {
        id: 'summer2024',
        name: 'Summer Sale'
      }
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })

    // Mock Stripe payment intent creation
    stripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_456',
      amount: 4700,
      currency: 'usd'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)

    // Verify Stripe was called with sale pricing
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 4700, // $47.00 in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        email: 'test@example.com',
        name: 'Test User',
        product: 'The Art of AI Sampling Course',
        price_paid: '47',
        stripe_price_id: 'price_1RYWXJGk1M5Eg2svgJntoCRs',
        is_on_sale: 'true',
        sale_type: 'summer2024',
        original_price: '97',
        savings: '50'
      }
    })
  })

  test('should handle missing email', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test User'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Email and name are required')
  })

  test('should handle missing name', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Email and name are required')
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

  test('should handle Stripe errors', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })

    // Mock Stripe error
    stripe.paymentIntents.create.mockRejectedValue(new Error('Stripe error'))

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Payment intent creation failed')
  })
})