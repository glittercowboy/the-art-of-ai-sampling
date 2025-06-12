// ABOUTME: Tests for unique visitor tracking functionality
// ABOUTME: Verifies that unique visitors are tracked correctly using persistent sets

import { createMocks } from 'node-mocks-http'
import statsHandler from '../pages/api/stats'
import trackHandler from '../pages/api/analytics/track'
import batchHandler from '../pages/api/analytics/batch'
import * as analyticsStorage from '../lib/analytics-storage'

// Mock the storage module
jest.mock('../lib/analytics-storage')

describe('Unique Visitor Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Set up default mocks
    analyticsStorage.checkConnection.mockResolvedValue({ connected: true, type: 'memory' })
    analyticsStorage.incrementCounter.mockResolvedValue(1)
    analyticsStorage.setSessionData.mockResolvedValue(true)
    analyticsStorage.getCounter.mockResolvedValue(0)
    analyticsStorage.getKeysByPattern.mockResolvedValue([])
    analyticsStorage.setCounter.mockResolvedValue('OK')
    analyticsStorage.batchIncrement.mockResolvedValue(true)
    analyticsStorage.setSession.mockResolvedValue('OK')
    analyticsStorage.addUnique.mockResolvedValue(true)
    analyticsStorage.countUnique.mockResolvedValue(0)
  })

  describe('Track API', () => {
    it('should track unique visitors in persistent set', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          event_type: 'pageview',
          session_id: 'test-session-123',
          timestamp: Date.now()
        }
      })

      await trackHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      // Should call addUnique for overall unique visitors
      expect(analyticsStorage.addUnique).toHaveBeenCalledWith(
        'analytics:visitors:unique',
        'test-session-123'
      )
      
      // Should call addUnique for daily unique visitors
      const today = new Date().toISOString().split('T')[0]
      expect(analyticsStorage.addUnique).toHaveBeenCalledWith(
        `analytics:visitors:unique:${today}`,
        'test-session-123'
      )
    })

    it('should track the same visitor only once', async () => {
      // First visit - new visitor
      analyticsStorage.addUnique.mockResolvedValueOnce(true)
      
      const { req: req1, res: res1 } = createMocks({
        method: 'POST',
        body: {
          event_type: 'pageview',
          session_id: 'test-session-456',
          timestamp: Date.now()
        }
      })

      await trackHandler(req1, res1)
      
      // Second visit - returning visitor
      analyticsStorage.addUnique.mockResolvedValueOnce(false)
      
      const { req: req2, res: res2 } = createMocks({
        method: 'POST',
        body: {
          event_type: 'click',
          session_id: 'test-session-456',
          timestamp: Date.now()
        }
      })

      await trackHandler(req2, res2)
      
      // Should have called addUnique twice for each set
      expect(analyticsStorage.addUnique).toHaveBeenCalledTimes(4)
    })
  })

  describe('Batch API', () => {
    it('should track unique visitors from batch events', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          events: [
            {
              eventId: '1',
              eventName: 'page_view',
              timestamp: Date.now(),
              sessionId: 'batch-session-1'
            },
            {
              eventId: '2',
              eventName: 'click',
              timestamp: Date.now(),
              sessionId: 'batch-session-2'
            },
            {
              eventId: '3',
              eventName: 'scroll_depth',
              timestamp: Date.now(),
              sessionId: 'batch-session-1' // Same session as first event
            }
          ]
        }
      })

      await batchHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      // Should track both unique sessions
      expect(analyticsStorage.addUnique).toHaveBeenCalledWith(
        'analytics:visitors:unique',
        'batch-session-1'
      )
      expect(analyticsStorage.addUnique).toHaveBeenCalledWith(
        'analytics:visitors:unique',
        'batch-session-2'
      )
      
      // Should also track daily unique visitors
      const today = new Date().toISOString().split('T')[0]
      expect(analyticsStorage.addUnique).toHaveBeenCalledWith(
        `analytics:visitors:unique:${today}`,
        'batch-session-1'
      )
      expect(analyticsStorage.addUnique).toHaveBeenCalledWith(
        `analytics:visitors:unique:${today}`,
        'batch-session-2'
      )
    })
  })

  describe('Stats API', () => {
    it('should read unique visitors from persistent set', async () => {
      // Mock authentication
      process.env.ANALYTICS_PASSWORD = 'test-password'
      
      // Mock unique visitor counts
      analyticsStorage.countUnique
        .mockResolvedValueOnce(1234) // Total unique visitors
        .mockResolvedValueOnce(56)   // Today's unique visitors
      
      // Mock other metrics
      analyticsStorage.getCounter.mockResolvedValue(0)
      
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-password'
        }
      })

      await statsHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const stats = JSON.parse(res._getData())
      expect(stats.visitors.unique).toBe(1234)
      
      // Should have called countUnique for overall unique visitors
      expect(analyticsStorage.countUnique).toHaveBeenCalledWith('analytics:visitors:unique')
      
      // Should have called countUnique for today's unique visitors
      const today = new Date().toISOString().split('T')[0]
      expect(analyticsStorage.countUnique).toHaveBeenCalledWith(`analytics:visitors:unique:${today}`)
    })

    it('should not count expired sessions', async () => {
      process.env.ANALYTICS_PASSWORD = 'test-password'
      
      // Mock that session keys would return empty (expired)
      analyticsStorage.getKeysByPattern.mockResolvedValue([])
      
      // But unique visitor set still has the visitors
      analyticsStorage.countUnique.mockResolvedValue(100)
      
      analyticsStorage.getCounter.mockResolvedValue(0)
      
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-password'
        }
      })

      await statsHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const stats = JSON.parse(res._getData())
      expect(stats.visitors.unique).toBe(100) // Should still show 100 unique visitors
      
      // Should NOT have called getKeysByPattern for sessions
      expect(analyticsStorage.getKeysByPattern).not.toHaveBeenCalledWith('analytics:session:*')
    })
  })
})