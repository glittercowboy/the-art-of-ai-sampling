// ABOUTME: Storage layer for analytics data using Upstash Redis
// ABOUTME: Provides atomic operations for counters and session management

let client = null
let isConnected = false

// Initialize Redis client
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const { Redis } = require('@upstash/redis')
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    isConnected = true
    console.log('✅ Connected to Upstash Redis')
  } catch (error) {
    console.warn('⚠️ Failed to connect to Upstash Redis:', error.message)
  }
}

// Fallback to in-memory storage for development/testing
if (!isConnected) {
  console.log('📝 Using in-memory storage for development')
  const storage = new Map()
  client = {
    incr: async (key) => {
      const current = storage.get(key) || 0
      const newValue = current + 1
      storage.set(key, newValue)
      console.log(`📊 Analytics: ${key} = ${newValue}`)
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
    expire: async (key, seconds) => 1,
    keys: async (pattern) => {
      const keys = Array.from(storage.keys())
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1)
        return keys.filter(key => key.startsWith(prefix))
      }
      return keys.filter(key => key === pattern)
    }
  }
  isConnected = true
}

/**
 * Increment a counter atomically
 * @param {string} key - The counter key
 * @returns {Promise<number>} The new counter value
 */
async function incrementCounter(key) {
  if (!isConnected) {
    throw new Error('KV storage not connected')
  }
  return await client.incr(key)
}

/**
 * Get the current value of a counter
 * @param {string} key - The counter key
 * @returns {Promise<number>} The counter value (0 if not exists)
 */
async function getCounter(key) {
  if (!isConnected) {
    throw new Error('KV storage not connected')
  }
  const value = await client.get(key)
  return value || 0
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

module.exports = {
  client,
  isConnected,
  incrementCounter,
  getCounter,
  setCounter,
  setSessionData,
  getKeysByPattern
}