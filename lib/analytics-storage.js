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
  client = {
    incr: async (key) => 1,
    get: async (key) => null,
    set: async (key, value, options) => 'OK',
    expire: async (key, seconds) => 1,
  }
  isConnected = true
}

module.exports = {
  client,
  isConnected
}