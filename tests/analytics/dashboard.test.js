// ABOUTME: Test suite for analytics dashboard authentication and data access
// ABOUTME: Ensures secure access to visitor statistics and metrics

/**
 * @jest-environment jsdom
 */

const { createMocks } = require('node-mocks-http')

describe('Analytics Dashboard - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('Stats Page Protection', () => {
    it('should return 401 without authentication', async () => {
      // This will fail until we create the stats API endpoint
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/stats'
      })

      const handler = require('../../pages/api/stats').default
      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Authentication required'
      })
    })

    it('should return 401 with incorrect password', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/stats',
        headers: {
          authorization: 'Bearer wrongpassword'
        }
      })

      const handler = require('../../pages/api/stats').default
      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid credentials'
      })
    })

    it('should return 200 with correct password', async () => {
      // Mock environment variable
      const originalEnv = process.env.ANALYTICS_PASSWORD
      process.env.ANALYTICS_PASSWORD = 'test-password-123'

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/stats',
        headers: {
          authorization: 'Bearer test-password-123'
        }
      })

      const handler = require('../../pages/api/stats').default
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      // Restore environment
      process.env.ANALYTICS_PASSWORD = originalEnv
    })

    it('should only accept GET requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/stats'
      })

      const handler = require('../../pages/api/stats').default
      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed'
      })
    })
  })

  describe('Stats Data Response', () => {
    beforeEach(() => {
      // Set up authenticated environment
      process.env.ANALYTICS_PASSWORD = 'test-password-123'
    })

    afterEach(() => {
      delete process.env.ANALYTICS_PASSWORD
    })

    it('should return basic analytics structure', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/stats',
        headers: {
          authorization: 'Bearer test-password-123'
        }
      })

      const handler = require('../../pages/api/stats').default
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('visitors')
      expect(data).toHaveProperty('clicks')  
      expect(data).toHaveProperty('conversions')
      expect(data).toHaveProperty('averageTime')
      expect(data).toHaveProperty('scrollDepth')
      expect(data).toHaveProperty('timeline')
      expect(data).toHaveProperty('lastUpdated')
    })

    it('should return visitor metrics', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/stats',
        headers: {
          authorization: 'Bearer test-password-123'
        }
      })

      const handler = require('../../pages/api/stats').default
      await handler(req, res)

      const data = JSON.parse(res._getData())
      
      expect(data.visitors).toHaveProperty('total')
      expect(data.visitors).toHaveProperty('today')
      expect(data.visitors).toHaveProperty('unique')
      expect(typeof data.visitors.total).toBe('number')
      expect(typeof data.visitors.today).toBe('number')
      expect(typeof data.visitors.unique).toBe('number')
    })

    it('should return click metrics', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/stats',
        headers: {
          authorization: 'Bearer test-password-123'
        }
      })

      const handler = require('../../pages/api/stats').default
      await handler(req, res)

      const data = JSON.parse(res._getData())
      
      expect(data.clicks).toHaveProperty('total')
      expect(data.clicks).toHaveProperty('today')
      expect(data.clicks).toHaveProperty('rate')
      expect(typeof data.clicks.total).toBe('number')
      expect(typeof data.clicks.today).toBe('number')
      expect(typeof data.clicks.rate).toBe('number')
    })

    it('should return scroll depth summary', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/stats',
        headers: {
          authorization: 'Bearer test-password-123'
        }
      })

      const handler = require('../../pages/api/stats').default
      await handler(req, res)

      const data = JSON.parse(res._getData())
      
      expect(data.scrollDepth).toHaveProperty('average')
      expect(data.scrollDepth).toHaveProperty('distribution')
      expect(Array.isArray(data.scrollDepth.distribution)).toBe(true)
      expect(typeof data.scrollDepth.average).toBe('number')
    })

    it('should return recent timeline data', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/stats',
        headers: {
          authorization: 'Bearer test-password-123'
        }
      })

      const handler = require('../../pages/api/stats').default
      await handler(req, res)

      const data = JSON.parse(res._getData())
      
      expect(Array.isArray(data.timeline)).toBe(true)
      // Should have at least today's data
      expect(data.timeline.length).toBeGreaterThan(0)
      
      if (data.timeline.length > 0) {
        const timelineEntry = data.timeline[0]
        expect(timelineEntry).toHaveProperty('date')
        expect(timelineEntry).toHaveProperty('visitors')
        expect(timelineEntry).toHaveProperty('clicks')
      }
    })

    it('should return fresh data (less than 5 minutes old)', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/stats',
        headers: {
          authorization: 'Bearer test-password-123'
        }
      })

      const handler = require('../../pages/api/stats').default
      await handler(req, res)

      const data = JSON.parse(res._getData())
      
      const lastUpdated = new Date(data.lastUpdated)
      const now = new Date()
      const diffMinutes = (now - lastUpdated) / (1000 * 60)
      
      expect(diffMinutes).toBeLessThan(5)
    })
  })
})