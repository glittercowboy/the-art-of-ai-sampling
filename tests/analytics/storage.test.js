// ABOUTME: Test suite for analytics storage operations using Vercel KV
// ABOUTME: Ensures proper initialization, atomic operations, and TTL functionality

describe('Analytics Storage - Vercel KV', () => {
  let storage

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules() // Reset module cache to get fresh instance
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

  it('should increment a counter atomically', async () => {
    const result = await storage.incrementCounter('analytics:pageviews:today')
    expect(result).toBe(1)
  })

  it('should read counter values', async () => {
    // First increment a counter
    await storage.incrementCounter('analytics:unique:today')
    
    // Then read it
    const value = await storage.getCounter('analytics:unique:today')
    expect(value).toBe(1)
  })

  it('should return 0 for non-existent counters', async () => {
    const value = await storage.getCounter('analytics:nonexistent:counter')
    expect(value).toBe(0)
  })
})