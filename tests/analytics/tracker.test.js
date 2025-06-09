// ABOUTME: Test suite for client-side analytics tracking functionality
// ABOUTME: Tests pageview, session, referrer, and UTM parameter tracking

/**
 * @jest-environment jsdom
 */

describe('Analytics Tracker - Client Side', () => {
  let tracker

  beforeEach(() => {
    // Reset DOM and modules
    jest.resetModules()
    jest.clearAllMocks()
    
    // Mock fetch for API calls
    global.fetch = jest.fn()
    
    // Mock sessionStorage
    const mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    })
    
    // Mock location
    delete window.location
    window.location = {
      href: 'https://taches.ai/',
      search: '',
      pathname: '/'
    }
    
    // Mock document.referrer
    Object.defineProperty(document, 'referrer', {
      value: 'https://google.com',
      writable: true
    })
  })

  it('should initialize and send pageview event on load', async () => {
    // This will fail until we create the tracker
    tracker = require('../../lib/analytics-tracker')
    
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })
    
    // Initialize tracker (should send pageview)
    await tracker.init()
    
    // Verify pageview event was sent
    expect(global.fetch).toHaveBeenCalledTimes(1)
    
    const [url, options] = global.fetch.mock.calls[0]
    expect(url).toBe('/api/analytics/track')
    expect(options.method).toBe('POST')
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' })
    
    const payload = JSON.parse(options.body)
    expect(payload.event_type).toBe('pageview')
    expect(payload.timestamp).toEqual(expect.any(Number))
    expect(payload.session_id).toEqual(expect.any(String))
    expect(payload.page_url).toBe('https://taches.ai/')
    expect(payload.referrer).toBe('https://google.com')
    expect(payload.data).toEqual({})
  })
})