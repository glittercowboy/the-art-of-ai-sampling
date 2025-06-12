// ABOUTME: Tests for analytics storage layer with Redis connection handling
// ABOUTME: Verifies connection fallback and atomic counter operations

import { jest } from '@jest/globals'

// Mock the logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    devWarn: jest.fn(),
    dev: jest.fn(),
    error: jest.fn()
  }
}))

// Mock @upstash/redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation((config) => {
    // Simulate connection based on config
    if (config.url && config.token) {
      return {
        incr: jest.fn().mockResolvedValue(1),
        incrby: jest.fn().mockResolvedValue(2),
        get: jest.fn().mockResolvedValue('100'),
        set: jest.fn().mockResolvedValue('OK'),
        setex: jest.fn().mockResolvedValue('OK'),
        sadd: jest.fn().mockResolvedValue(1),
        scard: jest.fn().mockResolvedValue(5),
        keys: jest.fn().mockResolvedValue(['key1', 'key2']),
        mget: jest.fn().mockResolvedValue(['10', '20']),
        ping: jest.fn().mockResolvedValue('PONG'),
        pipeline: jest.fn().mockReturnValue({
          incr: jest.fn().mockReturnThis(),
          incrby: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([{ result: 1 }, { result: 2 }])
        })
      }
    }
    throw new Error('Invalid Redis configuration')
  })
}))

describe('Analytics Storage', () => {
  let analyticsStorage
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Redis Connection', () => {
    it('should connect to Redis when credentials exist', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      const storage = await import('../analytics-storage.js')
      
      // Test connection
      const status = await storage.checkConnection()
      expect(status.connected).toBe(true)
      expect(status.type).toBe('redis')
    })

    it('should connect using Vercel KV variables as fallback', async () => {
      process.env.KV_REST_API_URL = 'https://test.upstash.io'
      process.env.KV_REST_API_TOKEN = 'test-token'

      const storage = await import('../analytics-storage.js')
      
      const status = await storage.checkConnection()
      expect(status.connected).toBe(true)
      expect(status.type).toBe('redis')
    })

    it('should fall back to memory when Redis unavailable', async () => {
      // No Redis credentials
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
      delete process.env.KV_REST_API_URL
      delete process.env.KV_REST_API_TOKEN

      const storage = await import('../analytics-storage.js')
      
      const status = await storage.checkConnection()
      expect(status.connected).toBe(true)
      expect(status.type).toBe('memory')
    })

    it('should handle Redis connection errors gracefully', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'invalid-url'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'invalid-token'

      // Mock Redis to throw error
      const { Redis } = require('@upstash/redis')
      Redis.mockImplementationOnce(() => {
        throw new Error('Connection failed')
      })

      const storage = await import('../analytics-storage.js')
      
      const status = await storage.checkConnection()
      expect(status.connected).toBe(true)
      expect(status.type).toBe('memory')
    })
  })

  describe('Atomic Operations', () => {
    beforeEach(async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
      analyticsStorage = await import('../analytics-storage.js')
    })

    it('should increment counters atomically', async () => {
      const result = await analyticsStorage.incrementCounter('test:counter')
      expect(result).toBe(1)

      const result2 = await analyticsStorage.incrementCounter('test:counter', 5)
      expect(result2).toBe(2) // Mock always returns 2 for incrby
    })

    it('should handle concurrent increments safely', async () => {
      const promises = Array(10).fill().map(() => 
        analyticsStorage.incrementCounter('concurrent:counter')
      )
      
      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)
      expect(results.every(r => typeof r === 'number')).toBe(true)
    })

    it('should get counter values', async () => {
      const value = await analyticsStorage.getCounter('test:counter')
      expect(value).toBe(100) // Mock returns '100'
    })

    it('should track unique values', async () => {
      const isNew = await analyticsStorage.addUnique('visitors:unique', 'user123')
      expect(isNew).toBe(true)

      const count = await analyticsStorage.countUnique('visitors:unique')
      expect(count).toBe(5) // Mock returns 5
    })
  })

  describe('Memory Storage Fallback', () => {
    beforeEach(async () => {
      // Force memory storage
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN
      delete process.env.KV_REST_API_URL
      delete process.env.KV_REST_API_TOKEN
      analyticsStorage = await import('../analytics-storage.js')
    })

    it('should increment counters in memory', async () => {
      const result1 = await analyticsStorage.incrementCounter('memory:counter')
      expect(result1).toBe(1)

      const result2 = await analyticsStorage.incrementCounter('memory:counter')
      expect(result2).toBe(2)

      const result3 = await analyticsStorage.incrementCounter('memory:counter', 3)
      expect(result3).toBe(5)
    })

    it('should track unique values in memory', async () => {
      const isNew1 = await analyticsStorage.addUnique('memory:unique', 'user1')
      expect(isNew1).toBe(true)

      const isNew2 = await analyticsStorage.addUnique('memory:unique', 'user1')
      expect(isNew2).toBe(false)

      const isNew3 = await analyticsStorage.addUnique('memory:unique', 'user2')
      expect(isNew3).toBe(true)

      const count = await analyticsStorage.countUnique('memory:unique')
      expect(count).toBe(2)
    })

    it('should handle session data with TTL', async () => {
      await analyticsStorage.setSession('session:123', { userId: 'user1' }, 3600)
      
      const data = await analyticsStorage.getSession('session:123')
      expect(data).toEqual({ userId: 'user1' })
    })
  })

  describe('Batch Operations', () => {
    beforeEach(async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
      analyticsStorage = await import('../analytics-storage.js')
    })

    it('should process batch increments efficiently', async () => {
      const counters = {
        'analytics:pageviews:total': 1,
        'analytics:pageviews:2024-01-01': 1,
        'analytics:clicks:total': 2,
        'analytics:clicks:2024-01-01': 2
      }

      await analyticsStorage.batchIncrement(counters)
      
      // Verify pipeline was used
      const { Redis } = require('@upstash/redis')
      const mockInstance = Redis.mock.results[0].value
      expect(mockInstance.pipeline).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    })

    it('should handle Redis errors gracefully', async () => {
      const { Redis } = require('@upstash/redis')
      Redis.mockImplementationOnce(() => ({
        incr: jest.fn().mockRejectedValue(new Error('Redis error')),
        ping: jest.fn().mockRejectedValue(new Error('Connection lost'))
      }))

      const storage = await import('../analytics-storage.js')
      
      // Should not throw, but return fallback values
      const result = await storage.incrementCounter('error:counter')
      expect(result).toBe(0)
    })
  })
})