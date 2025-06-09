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
    
    // Clean up DOM
    document.body.innerHTML = ''
    
    // Remove event listeners (prevent accumulation across tests)
    const events = ['click', 'scroll']
    events.forEach(event => {
      // Remove all listeners by replacing the elements
      const newDocument = document.implementation.createHTMLDocument()
      const newWindow = { ...window }
      
      // Don't actually replace, just clear handlers
      jest.clearAllMocks()
    })
    
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

    it('should capture click coordinates', async () => {
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

      // Create a mock click event with coordinates
      const button = document.getElementById('checkout-btn')
      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 200,
        bubbles: true
      })
      
      button.dispatchEvent(clickEvent)

      // Wait for async tracking
      await new Promise(resolve => setTimeout(resolve, 10))

      const [, options] = global.fetch.mock.calls[0]
      const payload = JSON.parse(options.body)
      
      expect(payload.data.coordinates).toEqual({ x: 100, y: 200 })
    })

    it('should debounce rapid clicks', async () => {
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
      
      // Mock click responses
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      const button = document.getElementById('checkout-btn')
      
      // Click rapidly 3 times
      button.click()
      button.click()
      button.click()

      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 600))

      // Should only have tracked one click due to debouncing
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Scroll Depth Tracking', () => {
    beforeEach(() => {
      // Mock document scroll properties
      Object.defineProperty(document.documentElement, 'scrollTop', {
        writable: true,
        value: 0,
      })
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        writable: true,
        value: 2000,
      })
      Object.defineProperty(document.documentElement, 'clientHeight', {
        writable: true,
        value: 800,
      })
      
      // Reset tracking state for each test
      if (typeof tracker !== 'undefined' && tracker.resetTracking) {
        tracker.resetTracking()
      }
    })

    it('should track 25% scroll depth', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      tracker = require('../../lib/analytics-tracker')
      await tracker.init()

      // Clear the pageview call
      global.fetch.mockClear()
      
      // Mock scroll response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      // Simulate scroll to 25% (300px of 1200px scrollable)
      document.documentElement.scrollTop = 300
      
      // Trigger scroll event
      const scrollEvent = new Event('scroll')
      window.dispatchEvent(scrollEvent)

      // Wait for throttled tracking
      await new Promise(resolve => setTimeout(resolve, 50))

      // Verify scroll event was tracked
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"event_type":"scroll"')
      })

      const [, options] = global.fetch.mock.calls[0]
      const payload = JSON.parse(options.body)
      
      expect(payload.event_type).toBe('scroll')
      expect(payload.data.depth).toBe(25)
    })

    it('should track all scroll milestones', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      tracker = require('../../lib/analytics-tracker')
      await tracker.init()

      // Clear the pageview call
      global.fetch.mockClear()

      // Simulate scrolling to each milestone
      const milestones = [
        { scrollTop: 300, expectedDepth: 25 },   // 25%
        { scrollTop: 600, expectedDepth: 50 },   // 50%
        { scrollTop: 900, expectedDepth: 75 },   // 75%
        { scrollTop: 1200, expectedDepth: 100 }  // 100%
      ]

      for (const milestone of milestones) {
        document.documentElement.scrollTop = milestone.scrollTop
        const scrollEvent = new Event('scroll')
        window.dispatchEvent(scrollEvent)
        
        // Wait for throttling
        await new Promise(resolve => setTimeout(resolve, 1100))
      }

      // Should have tracked 4 scroll events
      expect(global.fetch).toHaveBeenCalledTimes(4)
      
      // Verify each milestone was tracked correctly
      milestones.forEach((milestone, index) => {
        const [, options] = global.fetch.mock.calls[index]
        const payload = JSON.parse(options.body)
        expect(payload.data.depth).toBe(milestone.expectedDepth)
      })
    })

    it('should throttle rapid scroll events', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      tracker = require('../../lib/analytics-tracker')
      await tracker.init()

      // Clear the pageview call
      global.fetch.mockClear()

      // Rapidly scroll multiple times to 25% milestone
      for (let i = 0; i < 5; i++) {
        document.documentElement.scrollTop = 300  // Consistent 25% milestone
        const scrollEvent = new Event('scroll')
        window.dispatchEvent(scrollEvent)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 1200))

      // Should only have tracked one event due to throttling
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should not track same milestone twice', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })

      tracker = require('../../lib/analytics-tracker')
      await tracker.init()

      // Clear the pageview call
      global.fetch.mockClear()

      // Scroll to 25% twice
      document.documentElement.scrollTop = 300
      window.dispatchEvent(new Event('scroll'))
      
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Scroll back and forth in same milestone
      document.documentElement.scrollTop = 250
      window.dispatchEvent(new Event('scroll'))
      
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      document.documentElement.scrollTop = 320
      window.dispatchEvent(new Event('scroll'))
      
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should only track the 25% milestone once
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})