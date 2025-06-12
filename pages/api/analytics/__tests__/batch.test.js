// ABOUTME: Tests for batch analytics API endpoint
// ABOUTME: Verifies batch event processing, validation, and error handling

import { createMocks } from 'node-mocks-http'
import handler from '../batch'
import * as analyticsStorage from '../../../../lib/analytics-storage'

// Mock the storage module
jest.mock('../../../../lib/analytics-storage')

describe('/api/analytics/batch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock storage functions
    analyticsStorage.batchIncrement.mockResolvedValue(true)
    analyticsStorage.setSession.mockResolvedValue('OK')
    analyticsStorage.addUnique.mockResolvedValue(true)
  })

  it('should process multiple events in one request', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        events: [
          {
            eventId: '1',
            eventName: 'page_view',
            eventType: 'pageview',
            timestamp: Date.now(),
            sessionId: 'session-123',
            properties: { url: 'https://example.com' }
          },
          {
            eventId: '2',
            eventName: 'click',
            eventType: 'interaction',
            timestamp: Date.now(),
            sessionId: 'session-123',
            properties: { element: 'button' }
          }
        ]
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      processed: 2,
      failed: 0
    })
    
    // Verify storage was called
    expect(analyticsStorage.batchIncrement).toHaveBeenCalled()
  })

  it('should validate each event in batch', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        events: [
          {
            eventId: '1',
            eventName: 'page_view',
            eventType: 'pageview',
            timestamp: Date.now(),
            sessionId: 'session-123',
            properties: {}
          },
          {
            // Missing required fields
            eventId: '2',
            eventName: 'click'
          },
          {
            eventId: '3',
            eventName: 'form_submit',
            eventType: 'conversion',
            timestamp: Date.now(),
            sessionId: 'session-456',
            properties: {}
          }
        ]
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const response = JSON.parse(res._getData())
    expect(response.processed).toBe(2)
    expect(response.failed).toBe(1)
    expect(response.errors).toHaveLength(1)
    expect(response.errors[0]).toMatchObject({
      eventId: '2',
      error: expect.stringContaining('Missing required fields')
    })
  })

  it('should handle partial batch failures', async () => {
    // Make one storage call fail
    analyticsStorage.batchIncrement
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('Storage error'))

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        events: [
          {
            eventId: '1',
            eventName: 'page_view',
            eventType: 'pageview',
            timestamp: Date.now(),
            sessionId: 'session-123',
            properties: {}
          },
          {
            eventId: '2',
            eventName: 'click',
            eventType: 'interaction',
            timestamp: Date.now(),
            sessionId: 'session-123',
            properties: {}
          }
        ]
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const response = JSON.parse(res._getData())
    expect(response.processed).toBe(1)
    expect(response.failed).toBe(1)
  })

  it('should reject non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should validate request body', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        // Missing events array
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid request body'
    })
  })

  it('should handle empty events array', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        events: []
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'No events to process'
    })
  })

  it('should enforce batch size limit', async () => {
    const events = Array(101).fill({
      eventId: '1',
      eventName: 'page_view',
      eventType: 'pageview',
      timestamp: Date.now(),
      sessionId: 'session-123',
      properties: {}
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: { events }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Batch size exceeds limit (100)'
    })
  })

  it('should aggregate metrics correctly', async () => {
    const now = Date.now()
    const events = [
      {
        eventId: '1',
        eventName: 'page_view',
        eventType: 'pageview',
        timestamp: now,
        sessionId: 'session-123',
        properties: {}
      },
      {
        eventId: '2',
        eventName: 'page_view',
        eventType: 'pageview',
        timestamp: now,
        sessionId: 'session-456',
        properties: {}
      },
      {
        eventId: '3',
        eventName: 'click',
        eventType: 'interaction',
        timestamp: now,
        sessionId: 'session-123',
        properties: { action: 'checkout_click' }
      }
    ]

    const { req, res } = createMocks({
      method: 'POST',
      body: { events }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    
    // Check that batchIncrement was called with correct counters
    expect(analyticsStorage.batchIncrement).toHaveBeenCalledWith(
      expect.objectContaining({
        'analytics:pageviews:total': 2,
        'analytics:clicks:total': 1
      })
    )
  })

  it('should track unique sessions', async () => {
    const events = [
      {
        eventId: '1',
        eventName: 'page_view',
        eventType: 'pageview',
        timestamp: Date.now(),
        sessionId: 'session-123',
        properties: {}
      },
      {
        eventId: '2',
        eventName: 'click',
        eventType: 'interaction',
        timestamp: Date.now(),
        sessionId: 'session-456',
        properties: {}
      }
    ]

    const { req, res } = createMocks({
      method: 'POST',
      body: { events }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    
    // Should track both unique sessions
    expect(analyticsStorage.setSession).toHaveBeenCalledTimes(2)
    expect(analyticsStorage.setSession).toHaveBeenCalledWith(
      'analytics:session:session-123',
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('should handle malformed JSON gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: 'invalid json'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid request body'
    })
  })
})