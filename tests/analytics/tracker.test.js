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
    expect(payload.data.viewport).toEqual({ width: 1024, height: 768 }) // jsdom defaults
  })

  it('should generate unique session IDs', () => {
    tracker = require('../../lib/analytics-tracker')
    
    const sessionId1 = tracker.getSessionId()
    const sessionId2 = tracker.getSessionId()
    
    // Same call should return same ID
    expect(sessionId1).toBe(sessionId2)
    expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/)
    
    // Verify it was stored in sessionStorage
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('analytics_session_id', sessionId1)
  })

  it('should reuse existing session ID from sessionStorage', () => {
    const existingId = 'session_123_existing'
    window.sessionStorage.getItem.mockReturnValue(existingId)
    
    tracker = require('../../lib/analytics-tracker')
    
    const sessionId = tracker.getSessionId()
    expect(sessionId).toBe(existingId)
    expect(window.sessionStorage.getItem).toHaveBeenCalledWith('analytics_session_id')
  })

  it('should handle missing sessionStorage gracefully', () => {
    // Remove sessionStorage
    delete window.sessionStorage
    
    tracker = require('../../lib/analytics-tracker')
    
    const sessionId = tracker.getSessionId()
    expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/)
  })

  it('should extract UTM parameters from URL', async () => {
    // Set URL with UTM parameters
    window.location.search = '?utm_source=facebook&utm_medium=cpc&utm_campaign=course_launch&utm_content=video_ad'
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })
    
    tracker = require('../../lib/analytics-tracker')
    await tracker.init()
    
    const [, options] = global.fetch.mock.calls[0]
    const payload = JSON.parse(options.body)
    
    expect(payload.data.utm_source).toBe('facebook')
    expect(payload.data.utm_medium).toBe('cpc')
    expect(payload.data.utm_campaign).toBe('course_launch')
    expect(payload.data.utm_content).toBe('video_ad')
  })

  it('should handle URLs without UTM parameters', async () => {
    window.location.search = ''
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })
    
    tracker = require('../../lib/analytics-tracker')
    await tracker.init()
    
    const [, options] = global.fetch.mock.calls[0]
    const payload = JSON.parse(options.body)
    
    // Should still have viewport but no UTM params
    expect(payload.data.viewport).toEqual({ width: 1024, height: 768 })
    expect(payload.data.utm_source).toBeUndefined()
  })

  it('should capture viewport dimensions', async () => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true })
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })
    
    tracker = require('../../lib/analytics-tracker')
    await tracker.init()
    
    const [, options] = global.fetch.mock.calls[0]
    const payload = JSON.parse(options.body)
    
    expect(payload.data.viewport).toEqual({ width: 1920, height: 1080 })
  })

  describe('Click Tracking', () => {
    it('should track checkout button clicks', async () => {
      // Create a checkout button in the DOM
      document.body.innerHTML = `
        <button id="checkout-btn" class="checkout-button">
          Start Course - $97
        </button>
      `
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      tracker = require('../../lib/analytics-tracker')
      await tracker.init()

      // Clear the pageview call
      global.fetch.mockClear()
      
      // Mock click response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      // Click the button
      const button = document.getElementById('checkout-btn')
      button.click()

      // Wait for async tracking
      await new Promise(resolve => setTimeout(resolve, 10))

      // Verify click was tracked
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event_type":"click"')
      })

      const [, options] = global.fetch.mock.calls[0]
      const payload = JSON.parse(options.body)
      
      expect(payload.event_type).toBe('click')
      expect(payload.data.element).toBe('checkout-button')
      expect(payload.data.element_text).toBe('Start Course - $97')
    })

    it('should not track clicks on non-tracked elements', async () => {
      // Create elements in the DOM
      document.body.innerHTML = `
        <button id="other-btn">Other Button</button>
        <div id="random-div">Random Div</div>
      `
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      
      tracker = require('../../lib/analytics-tracker')
      await tracker.init()

      // Clear the pageview call
      global.fetch.mockClear()

      // Click non-tracked elements
      document.getElementById('other-btn').click()
      document.getElementById('random-div').click()

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10))

      // Should not have tracked any clicks
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should track manual click events', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      tracker = require('../../lib/analytics-tracker')
      
      // Manually track a click event
      await tracker.trackEvent('click', {
        element: 'custom-element',
        value: 97
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"element":"custom-element"')
      })
    })
  })
})