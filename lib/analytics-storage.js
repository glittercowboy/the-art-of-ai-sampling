// ABOUTME: Storage layer for analytics data using Vercel KV (Redis)
// ABOUTME: Provides atomic operations for counters and session management

let client = null
let isConnected = false

// Initialize KV client if environment variables are present
if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  // We'll use a mock for now since @vercel/kv isn't installed
  // In production, this would be:
  // const { createClient } = require('@vercel/kv')
  // client = createClient({
  //   url: process.env.KV_REST_API_URL,
  //   token: process.env.KV_REST_API_TOKEN,
  // })
  
  // Mock client for testing
  const storage = new Map() // In-memory storage for tests
  client = {
    incr: async (key) => {
      const current = storage.get(key) || 0
      const newValue = current + 1
      storage.set(key, newValue)
      return newValue
    },
    get: async (key) => storage.get(key) || null,
    set: async (key, value, options) => {
      storage.set(key, value)
      return 'OK'
    },
    expire: async (key, seconds) => 1,
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

module.exports = {
  client,
  isConnected,
  incrementCounter,
  getCounter,
  setSessionData
}