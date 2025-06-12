// ABOUTME: Test suite for analytics tracking API endpoint
// ABOUTME: Ensures proper validation, error handling, and rate limiting

import { createMocks } from 'node-mocks-http'

describe('/api/analytics/track', () => {
  let handler

  beforeEach(() => {
    jest.clearAllMocks()
    // This will fail until we create the endpoint
    handler = require('../../pages/api/analytics/track').default
  })

  it('should return 200 for valid tracking request', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        event_type: 'pageview',
        timestamp: Date.now(),
        session_id: 'test-session-123',
        page_url: 'https://taches.ai',
        data: {}
      }
    })

    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({ success: true })
  })

  it('should validate required fields in request body', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        // Missing required fields
        data: {}
      }
    })

    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing required fields: event_type, session_id'
    })
  })

  it('should validate event_type is valid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        event_type: 'invalid_type',
        timestamp: Date.now(),
        session_id: 'test-session-123',
        data: {}
      }
    })

    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid event_type. Must be one of: pageview, click, scroll, engagement, lead_capture, checkout_form_shown, checkout_abandoned'
    })
  })

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: { 'content-type': 'application/json' }
    })

    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method not allowed'
    })
  })

  it('should handle empty request body', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {}
    })

    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Missing required fields: event_type, session_id'
    })
  })

  it('should handle array body gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: ['not', 'an', 'object']
    })

    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid request body'
    })
  })
})