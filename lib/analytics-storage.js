// ABOUTME: Storage layer for analytics data using Upstash Redis
// ABOUTME: Provides atomic operations for counters and session management

import { logger } from './logger'

let client = null
let isConnected = false

// Initialize Redis client - check for both Upstash and Vercel KV variables
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

if (redisUrl && redisToken) {
  try {
    const { Redis } = require('@upstash/redis')
    client = new Redis({
      url: redisUrl,
      token: redisToken,
    })
    isConnected = true
    logger.info('✅ Connected to Upstash Redis')
  } catch (error) {
    logger.devWarn('⚠️ Failed to connect to Upstash Redis:', error.message)
  }
}

// Fallback to in-memory storage for development/testing
if (!isConnected) {
  logger.dev('📝 Using in-memory storage for development')
  const storage = new Map()
  client = {
    incr: async (key) => {
      const current = storage.get(key) || 0
      const newValue = current + 1
      storage.set(key, newValue)
      logger.dev(`📊 Analytics: ${key} = ${newValue}`)
      return newValue
    },
    incrby: async (key, by) => {
      const current = storage.get(key) || 0
      const newValue = current + by
      storage.set(key, newValue)
      logger.dev(`📊 Analytics: ${key} = ${newValue} (+${by})`)
      return newValue
    },
    get: async (key) => {
      const value = storage.get(key) || null
      return value
    },
    set: async (key, value, options) => {
      storage.set(key, value)
      return 'OK'
    },
    setex: async (key, ttl, value) => {
      storage.set(key, value)
      // In-memory storage doesn't support TTL, but we simulate success
      return 'OK'
    },
    expire: async (key, seconds) => 1,
    keys: async (pattern) => {
      const keys = Array.from(storage.keys())
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1)
        return keys.filter(key => key.startsWith(prefix))
      }
      return keys.filter(key => key === pattern)
    },
    sadd: async (key, member) => {
      const set = storage.get(key) || new Set()
      const isNew = !set.has(member)
      set.add(member)
      storage.set(key, set)
      return isNew ? 1 : 0
    },
    scard: async (key) => {
      const set = storage.get(key)
      return set ? set.size : 0
    },
    pipeline: function() {
      const commands = []
      const self = this
      return {
        incr: function(key) {
          commands.push(() => self.incr(key))
          return this
        },
        incrby: function(key, by) {
          commands.push(() => self.incrby(key, by))
          return this
        },
        exec: async function() {
          const results = []
          for (const cmd of commands) {
            results.push({ result: await cmd() })
          }
          return results
        }
      }
    }
  }
  isConnected = true
}

/**
 * Check connection status
 * @returns {Promise<object>} Connection status
 */
async function checkConnection() {
  try {
    if (!client) {
      return { connected: false, type: 'none', error: 'No client initialized' }
    }
    
    // Check if using in-memory storage
    if (!redisUrl || !redisToken) {
      return { connected: true, type: 'memory' }
    }
    
    // Try to ping Redis
    if (client.ping) {
      await client.ping()
      return { connected: true, type: 'redis' }
    }
    
    return { connected: true, type: 'memory' }
  } catch (error) {
    return { connected: false, type: 'none', error: error.message }
  }
}

/**
 * Increment a counter atomically
 * @param {string} key - The counter key
 * @param {number} by - Amount to increment by (default: 1)
 * @returns {Promise<number>} The new counter value
 */
async function incrementCounter(key, by = 1) {
  try {
    if (!isConnected) {
      throw new Error('KV storage not connected')
    }
    
    if (by === 1) {
      return await client.incr(key)
    } else {
      // For in-memory storage
      if (!client.incrby) {
        const current = (await client.get(key)) || 0
        const newValue = current + by
        await client.set(key, newValue)
        return newValue
      }
      return await client.incrby(key, by)
    }
  } catch (error) {
    logger.error('Failed to increment counter:', error)
    return 0
  }
}

/**
 * Get the current value of a counter
 * @param {string} key - The counter key
 * @returns {Promise<number>} The counter value (0 if not exists)
 */
async function getCounter(key) {
  try {
    if (!isConnected) {
      throw new Error('KV storage not connected')
    }
    const value = await client.get(key)
    return parseInt(value) || 0
  } catch (error) {
    logger.error('Failed to get counter:', error)
    return 0
  }
}

/**
 * Set a counter to a specific value
 * @param {string} key - The counter key
 * @param {number} value - The value to set
 * @returns {Promise<string>} Result of the operation
 */
async function setCounter(key, value) {
  if (!isConnected) {
    throw new Error('KV storage not connected')
  }
  return await client.set(key, value)
}

/**
 * Set session data with TTL
 * @param {string} sessionId - The session ID
 * @param {object} data - Session data
 * @param {number} ttlSeconds - Time to live in seconds
 */
async function setSessionData(sessionId, data, ttlSeconds = 1800) {
  if (!isConnected) {
    throw new Error('KV storage not connected')
  }
  const key = `analytics:session:${sessionId}`
  await client.set(key, JSON.stringify(data))
  await client.expire(key, ttlSeconds)
}

/**
 * Get keys matching a pattern
 * @param {string} pattern - Pattern to match (supports * wildcard)
 * @returns {Promise<string[]>} Array of matching keys
 */
async function getKeysByPattern(pattern) {
  if (!isConnected) {
    throw new Error('KV storage not connected')
  }
  return await client.keys(pattern)
}

/**
 * Add a unique value to a set
 * @param {string} key - The set key
 * @param {string} value - The value to add
 * @returns {Promise<boolean>} True if value was new, false if already existed
 */
async function addUnique(key, value) {
  try {
    if (!isConnected) {
      throw new Error('KV storage not connected')
    }
    
    // For in-memory storage
    if (!client.sadd) {
      const set = client._sets || (client._sets = new Map())
      const existing = set.get(key) || new Set()
      const isNew = !existing.has(value)
      existing.add(value)
      set.set(key, existing)
      return isNew
    }
    
    const result = await client.sadd(key, value)
    return result === 1
  } catch (error) {
    logger.error('Failed to add unique value:', error)
    return false
  }
}

/**
 * Count unique values in a set
 * @param {string} key - The set key
 * @returns {Promise<number>} The number of unique values
 */
async function countUnique(key) {
  try {
    if (!isConnected) {
      throw new Error('KV storage not connected')
    }
    
    // For in-memory storage
    if (!client.scard) {
      const set = client._sets?.get(key)
      return set ? set.size : 0
    }
    
    return await client.scard(key)
  } catch (error) {
    logger.error('Failed to count unique values:', error)
    return 0
  }
}

/**
 * Set session data with expiry
 * @param {string} key - The session key
 * @param {object} data - The session data
 * @param {number} ttl - Time to live in seconds
 */
async function setSession(key, data, ttl) {
  try {
    if (!isConnected) {
      throw new Error('KV storage not connected')
    }
    
    // For Redis
    if (client.setex) {
      return await client.setex(key, ttl, JSON.stringify(data))
    }
    
    // For in-memory storage
    await client.set(key, JSON.stringify(data))
    if (client.expire) {
      await client.expire(key, ttl)
    }
    return 'OK'
  } catch (error) {
    logger.error('Failed to set session:', error)
    throw error
  }
}

/**
 * Get session data
 * @param {string} key - The session key
 * @returns {Promise<object|null>} The session data or null
 */
async function getSession(key) {
  try {
    if (!isConnected) {
      throw new Error('KV storage not connected')
    }
    
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    logger.error('Failed to get session:', error)
    return null
  }
}

/**
 * Batch increment multiple counters
 * @param {object} counters - Object with key-value pairs to increment
 */
async function batchIncrement(counters) {
  try {
    if (!isConnected) {
      throw new Error('KV storage not connected')
    }
    
    // For Redis with pipeline support
    if (client.pipeline) {
      const pipeline = client.pipeline()
      for (const [key, value] of Object.entries(counters)) {
        if (value === 1) {
          pipeline.incr(key)
        } else {
          pipeline.incrby(key, value)
        }
      }
      await pipeline.exec()
    } else {
      // Fallback to individual operations
      for (const [key, value] of Object.entries(counters)) {
        await incrementCounter(key, value)
      }
    }
  } catch (error) {
    logger.error('Failed to batch increment:', error)
    throw error
  }
}

module.exports = {
  client,
  isConnected,
  checkConnection,
  incrementCounter,
  getCounter,
  setCounter,
  setSessionData,
  getKeysByPattern,
  addUnique,
  countUnique,
  setSession,
  getSession,
  batchIncrement
}