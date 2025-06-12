// ABOUTME: Test suite for average time on page calculation
// ABOUTME: Verifies engagement time tracking and averaging works correctly

import { jest } from '@jest/globals'

// Mock analytics storage
const mockStorage = {
  counters: new Map(),
  sets: new Map(),
  
  incrementCounter: jest.fn(async function(key, by = 1) {
    const current = this.counters.get(key) || 0
    this.counters.set(key, current + by)
    return current + by
  }),
  
  getCounter: jest.fn(async function(key) {
    return this.counters.get(key) || 0
  }),
  
  setCounter: jest.fn(async function(key, value) {
    this.counters.set(key, value)
    return 'OK'
  }),
  
  addUnique: jest.fn(async function(key, value) {
    const set = this.sets.get(key) || new Set()
    const isNew = !set.has(value)
    set.add(value)
    this.sets.set(key, set)
    return isNew
  }),
  
  batchIncrement: jest.fn(async function(counters) {
    for (const [key, value] of Object.entries(counters)) {
      await this.incrementCounter(key, value)
    }
  }),
  
  setSession: jest.fn(async () => 'OK')
}

// Bind methods to mockStorage
Object.keys(mockStorage).forEach(key => {
  if (typeof mockStorage[key] === 'function') {
    mockStorage[key] = mockStorage[key].bind(mockStorage)
  }
})

jest.mock('../lib/analytics-storage', () => mockStorage)
jest.mock('../lib/logger', () => ({
  logger: {
    dev: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    devWarn: jest.fn(),
    sanitize: (data) => data
  }
}))

const handler = require('../pages/api/analytics/batch').default

describe('Average Time on Page', () => {
  let req, res

  beforeEach(() => {
    // Reset storage
    mockStorage.counters.clear()
    mockStorage.sets.clear()
    
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock request and response
    req = {
      method: 'POST',
      body: {}
    }
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
  })

  it('should correctly track engagement time from events', async () => {
    req.body = {
      events: [
        {
          eventId: '1',
          eventName: 'engagement_time',
          timestamp: Date.now(),
          sessionId: 'session-1',
          properties: {
            duration: 30 // 30 seconds
          }
        },
        {
          eventId: '2',
          eventName: 'engagement_time',
          timestamp: Date.now(),
          sessionId: 'session-2',
          properties: {
            duration: 45 // 45 seconds
          }
        }
      ]
    }

    await handler(req, res)

    // Check that engagement data was stored correctly
    expect(res.status).toHaveBeenCalledWith(200)
    
    // Total engagement time should be (30 + 45) * 1000 = 75000 ms
    const totalMs = await mockStorage.getCounter('analytics:engagement:total_ms')
    expect(totalMs).toBe(75000)
    
    // Engagement count should be 2
    const count = await mockStorage.getCounter('analytics:engagement:count')
    expect(count).toBe(2)
    
    // Average time should be 75000 / 2 = 37500 ms = 37.5 seconds
    const averageMs = totalMs / count
    const averageSeconds = Math.round(averageMs / 1000)
    expect(averageSeconds).toBe(38) // Rounded to 38 seconds
  })

  it('should handle engagement time of 0 correctly', async () => {
    req.body = {
      events: [
        {
          eventId: '1',
          eventName: 'engagement_time',
          timestamp: Date.now(),
          sessionId: 'session-1',
          properties: {
            duration: 0
          }
        }
      ]
    }

    await handler(req, res)

    // Should not increment counters for 0 duration
    const totalMs = await mockStorage.getCounter('analytics:engagement:total_ms')
    expect(totalMs).toBe(0)
    
    const count = await mockStorage.getCounter('analytics:engagement:count')
    expect(count).toBe(0)
  })

  it('should accumulate engagement time across multiple batches', async () => {
    // First batch
    req.body = {
      events: [
        {
          eventId: '1',
          eventName: 'engagement_time',
          timestamp: Date.now(),
          sessionId: 'session-1',
          properties: {
            duration: 20 // 20 seconds
          }
        }
      ]
    }

    await handler(req, res)

    // Second batch
    req.body = {
      events: [
        {
          eventId: '2',
          eventName: 'engagement_time',
          timestamp: Date.now(),
          sessionId: 'session-2',
          properties: {
            duration: 30 // 30 seconds
          }
        }
      ]
    }

    await handler(req, res)

    // Check accumulated values
    const totalMs = await mockStorage.getCounter('analytics:engagement:total_ms')
    expect(totalMs).toBe(50000) // (20 + 30) * 1000

    const count = await mockStorage.getCounter('analytics:engagement:count')
    expect(count).toBe(2)
  })
})