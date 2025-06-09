// ABOUTME: Test suite for analytics storage operations using Vercel KV
// ABOUTME: Ensures proper initialization, atomic operations, and TTL functionality

describe('Analytics Storage - Vercel KV', () => {
  let storage

  beforeEach(() => {
    jest.clearAllMocks()
    // This will fail until we create the storage module
    storage = require('../../lib/analytics-storage')
  })

  it('should initialize KV client successfully', async () => {
    expect(storage.client).toBeDefined()
    expect(storage.isConnected).toBe(true)
  })

  it('should handle missing KV environment variables gracefully', () => {
    // Temporarily remove env vars
    const originalUrl = process.env.KV_REST_API_URL
    const originalToken = process.env.KV_REST_API_TOKEN
    
    delete process.env.KV_REST_API_URL
    delete process.env.KV_REST_API_TOKEN
    
    // Re-require module to test initialization
    jest.resetModules()
    const storageWithoutEnv = require('../../lib/analytics-storage')
    
    expect(storageWithoutEnv.isConnected).toBe(false)
    expect(storageWithoutEnv.client).toBeNull()
    
    // Restore env vars
    process.env.KV_REST_API_URL = originalUrl
    process.env.KV_REST_API_TOKEN = originalToken
  })
})