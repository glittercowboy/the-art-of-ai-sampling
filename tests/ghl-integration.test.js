/**
 * Test: GHL Integration End-to-End
 * This test verifies that the GHL webhook integration works for course access provisioning
 */

import { sendWebhook } from '../lib/ghl'

// Mock fetch globally for this test
global.fetch = jest.fn()

describe('GHL Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/mGMWF3JpgTd8KeGbjWFM/webhook-trigger/7b5bb466-cd56-48f5-b099-7de5fd74e58a'
  })

  afterEach(() => {
    delete process.env.GHL_WEBHOOK_URL
  })

  test('should send course enrollment data to GHL webhook', async () => {
    // Mock successful GHL response
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Contact created successfully' })
    })

    const customerData = {
      email: 'test@example.com',
      name: 'John Doe',
      product: 'The Art of AI Sampling Course',
      paymentId: 'pi_test_12345',
      amount: 98.00
    }

    const result = await sendWebhook(customerData)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://services.leadconnectorhq.com/hooks/mGMWF3JpgTd8KeGbjWFM/webhook-trigger/7b5bb466-cd56-48f5-b099-7de5fd74e58a',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('"email":"test@example.com"')
      })
    )

    // Verify the body contains all expected fields
    const call = global.fetch.mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body).toMatchObject({
      email: 'test@example.com',
      name: 'John Doe',
      product: 'The Art of AI Sampling Course',
      paymentId: 'pi_test_12345',
      amount: 98.00,
      currency: 'USD',
      source: 'stripe'
    })
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

    expect(result).toEqual({ success: true, message: 'Contact created successfully' })
  })

  test('should handle GHL webhook timeout gracefully', async () => {
    // Mock timeout error
    global.fetch.mockRejectedValue(new Error('Request timeout'))

    const customerData = {
      email: 'test@example.com',
      name: 'John Doe',
      product: 'The Art of AI Sampling Course',
      paymentId: 'pi_test_12345',
      amount: 98.00
    }

    await expect(sendWebhook(customerData)).rejects.toThrow('Request timeout')
  }, 15000) // Extend timeout for retry logic

  test('should handle GHL 500 error response', async () => {
    // Mock GHL server error
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    })

    const customerData = {
      email: 'test@example.com',
      name: 'John Doe',
      product: 'The Art of AI Sampling Course',
      paymentId: 'pi_test_12345',
      amount: 98.00
    }

    await expect(sendWebhook(customerData)).rejects.toThrow('GHL webhook error (500): Internal Server Error')
  }, 15000) // Extend timeout for retry logic

  test('should handle missing GHL webhook URL', async () => {
    delete process.env.GHL_WEBHOOK_URL

    const customerData = {
      email: 'test@example.com',
      name: 'John Doe',
      product: 'The Art of AI Sampling Course',
      paymentId: 'pi_test_12345',
      amount: 98.00
    }

    await expect(sendWebhook(customerData)).rejects.toThrow('GHL_WEBHOOK_URL not configured in environment variables')
  })

  test('should handle GHL webhook with non-JSON response', async () => {
    // Mock response that doesn't have JSON
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('Invalid JSON') }
    })

    const customerData = {
      email: 'test@example.com',
      name: 'John Doe',
      product: 'The Art of AI Sampling Course',
      paymentId: 'pi_test_12345',
      amount: 98.00
    }

    const result = await sendWebhook(customerData)

    // Should return default success response when JSON parsing fails
    expect(result).toEqual({ success: true })
  })
})