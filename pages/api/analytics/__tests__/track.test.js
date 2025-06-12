// ABOUTME: Tests for track analytics API endpoint
// ABOUTME: Verifies unique visitor tracking and event processing

import { createMocks } from 'node-mocks-http'
import handler from '../track'
import * as analyticsStorage from '../../../../lib/analytics-storage'

// Mock the storage module
jest.mock('../../../../lib/analytics-storage')

describe('/api/analytics/track', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock storage functions
    analyticsStorage.incrementCounter.mockResolvedValue(1)
    analyticsStorage.setSessionData.mockResolvedValue(true)
    analyticsStorage.getCounter.mockResolvedValue(0)
    analyticsStorage.setCounter.mockResolvedValue('OK')
    analyticsStorage.addUnique.mockResolvedValue(true)
  })

  it('should track pageview events with unique visitor tracking', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        event_type: 'pageview',
        session_id: 'test-session-123',
        timestamp: Date.now()
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({ success: true })
    
    // Should increment pageview counters
    expect(analyticsStorage.incrementCounter).toHaveBeenCalledWith('analytics:pageviews:total')
    
    // Should track unique visitor
    expect(analyticsStorage.addUnique).toHaveBeenCalledWith(
      'analytics:visitors:unique',
      'test-session-123'
    )
    
    // Should track daily unique visitor
    const today = new Date().toISOString().split('T')[0]
    expect(analyticsStorage.addUnique).toHaveBeenCalledWith(
      `analytics:visitors:unique:${today}`,
      'test-session-123'
    )
  })

  it('should handle all event types', async () => {
    const eventTypes = [
      'pageview',
      'click',
      'lead_capture',
      'checkout_form_shown',
      'checkout_abandoned'
    ]

    for (const eventType of eventTypes) {
      jest.clearAllMocks()
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          event_type: eventType,
          session_id: `session-${eventType}`,
          timestamp: Date.now()
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(analyticsStorage.addUnique).toHaveBeenCalledWith(
        'analytics:visitors:unique',
        `session-${eventType}`
      )
    }
  })

  it('should validate required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        event_type: 'pageview'
        // Missing session_id
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing required fields: session_id'
    })
  })
})