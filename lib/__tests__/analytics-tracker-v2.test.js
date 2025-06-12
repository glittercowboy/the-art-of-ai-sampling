// ABOUTME: Tests for enhanced analytics tracker with batching and advanced tracking
// ABOUTME: Verifies event batching, click tracking, form tracking, and reading depth

import { jest } from '@jest/globals'
import { JSDOM } from 'jsdom'

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
})

global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

// Mock fetch
global.fetch = jest.fn()

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

describe('Enhanced Analytics Tracker', () => {
  let AnalyticsTracker
  
  beforeEach(async () => {
    jest.clearAllMocks()
    fetch.mockClear()
    
    // Import fresh instance
    const module = await import('../analytics-tracker-v2.js')
    AnalyticsTracker = module.default
  })

  describe('Event Batching', () => {
    it('should batch events before sending', async () => {
      const tracker = new AnalyticsTracker({
        endpoint: '/api/analytics/batch',
        batchSize: 3,
        flushInterval: 1000
      })

      // Track 3 events
      tracker.track('event1', { data: 1 })
      tracker.track('event2', { data: 2 })
      tracker.track('event3', { data: 3 })

      // Should send batch immediately when batch size is reached
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String)
      })
      
      // Check the body contains our events
      const call = fetch.mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.events).toHaveLength(3)
      expect(body.events[0]).toMatchObject({ eventName: 'event1' })
      expect(body.events[1]).toMatchObject({ eventName: 'event2' })
      expect(body.events[2]).toMatchObject({ eventName: 'event3' })
    })

    it('should flush events on interval', async () => {
      jest.useFakeTimers()
      
      const tracker = new AnalyticsTracker({
        endpoint: '/api/analytics/batch',
        batchSize: 10,
        flushInterval: 5000
      })

      tracker.track('event1')
      tracker.track('event2')

      expect(fetch).not.toHaveBeenCalled()

      // Fast forward 5 seconds
      jest.advanceTimersByTime(5000)

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('event1')
      })

      jest.useRealTimers()
    })

    it('should flush events on page unload', async () => {
      const tracker = new AnalyticsTracker({
        endpoint: '/api/analytics/batch',
        batchSize: 10
      })

      tracker.track('event1')
      tracker.track('event2')

      // Simulate page unload
      const unloadEvent = new Event('beforeunload')
      window.dispatchEvent(unloadEvent)

      expect(fetch).toHaveBeenCalled()
    })

    it('should handle batch API failures gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))
      
      const tracker = new AnalyticsTracker({
        endpoint: '/api/analytics/batch',
        batchSize: 1
      })

      // Should not throw
      expect(() => tracker.track('event1')).not.toThrow()
    })
  })

  describe('Enhanced Click Tracking', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <button data-track data-track-action="cta_click" data-track-label="Header CTA">
          Get Started
        </button>
        <a href="/pricing" data-track data-track-action="nav_click">Pricing</a>
        <button class="checkout-button">Buy Now</button>
        <div data-track>Trackable Div</div>
      `
    })

    it('should track all clicks with data-track attribute', () => {
      const tracker = new AnalyticsTracker({ batchSize: 100 })
      tracker.trackClicks()

      const button = document.querySelector('[data-track-action="cta_click"]')
      button.click()

      expect(fetch).toHaveBeenCalled()
      const call = fetch.mock.calls[0]
      const body = JSON.parse(call[1].body)
      const clickEvent = body.events[0]
      
      expect(clickEvent.eventName).toBe('click')
      expect(clickEvent.properties).toMatchObject({
        action: 'cta_click',
        label: 'Header CTA',
        text: 'Get Started',
        element: 'BUTTON'
      })
    })

    it('should track clicks with position data', () => {
      const tracker = new AnalyticsTracker({ batchSize: 100 })
      tracker.trackClicks()

      const link = document.querySelector('a[data-track]')
      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 200
      })
      link.dispatchEvent(clickEvent)

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining('"x":100')
      })
    })

    it('should debounce rapid clicks', async () => {
      jest.useFakeTimers()
      
      const tracker = new AnalyticsTracker({ 
        batchSize: 100,
        clickDebounce: 500 
      })
      tracker.trackClicks()

      const button = document.querySelector('button')
      
      // Click 5 times rapidly
      for (let i = 0; i < 5; i++) {
        button.click()
      }

      // Should only track once due to debouncing
      jest.runAllTimers()
      expect(fetch).toHaveBeenCalledTimes(1)

      jest.useRealTimers()
    })
  })

  describe('Form Interaction Tracking', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <form id="contact-form" data-track-form>
          <input name="email" type="email" required>
          <input name="name" type="text">
          <textarea name="message"></textarea>
          <button type="submit">Submit</button>
        </form>
        <form id="checkout-form">
          <input name="card" type="text">
          <button type="submit">Pay</button>
        </form>
      `
    })

    it('should track form start when first field is focused', () => {
      const tracker = new AnalyticsTracker({ batchSize: 100 })
      tracker.trackForms()

      const emailInput = document.querySelector('input[name="email"]')
      emailInput.focus()

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining(JSON.stringify({
          eventName: 'form_start',
          properties: expect.objectContaining({
            formId: 'contact-form',
            firstField: 'email'
          })
        }))
      })
    })

    it('should track form field interactions', () => {
      const tracker = new AnalyticsTracker({ batchSize: 100 })
      tracker.trackForms()

      const nameInput = document.querySelector('input[name="name"]')
      
      // Focus field
      nameInput.focus()
      
      // Type in field
      nameInput.value = 'John'
      
      // Blur field
      nameInput.blur()

      // Should track field interaction
      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining('form_field_complete')
      })
    })

    it('should track form abandonment', () => {
      const tracker = new AnalyticsTracker({ batchSize: 100 })
      tracker.trackForms()

      const emailInput = document.querySelector('input[name="email"]')
      emailInput.focus()
      emailInput.value = 'test@example.com'

      // Navigate away (simulate abandonment)
      const unloadEvent = new Event('beforeunload')
      window.dispatchEvent(unloadEvent)

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining('form_abandon')
      })
    })

    it('should track form submission', () => {
      const tracker = new AnalyticsTracker({ batchSize: 100 })
      tracker.trackForms()

      const form = document.querySelector('#contact-form')
      const submitEvent = new Event('submit')
      form.dispatchEvent(submitEvent)

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining('form_submit')
      })
    })

    it('should track time spent on each field', async () => {
      jest.useFakeTimers()
      
      const tracker = new AnalyticsTracker({ batchSize: 100 })
      tracker.trackForms()

      const emailInput = document.querySelector('input[name="email"]')
      
      emailInput.focus()
      jest.advanceTimersByTime(3000) // 3 seconds
      emailInput.blur()

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringMatching(/timeSpent":\s*3/)
      })

      jest.useRealTimers()
    })
  })

  describe('Reading Depth Tracking', () => {
    beforeEach(() => {
      // Create a tall page with content
      document.body.innerHTML = `
        <article class="content">
          <h1>Article Title</h1>
          ${Array(50).fill('<p>Lorem ipsum dolor sit amet...</p>').join('')}
        </article>
      `
      
      // Mock viewport
      Object.defineProperty(window, 'innerHeight', { value: 800 })
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000 })
    })

    it('should track scroll depth milestones', () => {
      const tracker = new AnalyticsTracker({ batchSize: 100 })
      tracker.trackScrollDepth({ milestones: [25, 50, 75, 100] })

      // Simulate scrolling to 25%
      Object.defineProperty(window, 'pageYOffset', { value: 1250 })
      window.dispatchEvent(new Event('scroll'))

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining(JSON.stringify({
          eventName: 'scroll_depth',
          properties: expect.objectContaining({
            depth: 25,
            maxDepth: 25
          })
        }))
      })
    })

    it('should track reading time at each milestone', async () => {
      jest.useFakeTimers()
      
      const tracker = new AnalyticsTracker({ batchSize: 100 })
      tracker.trackScrollDepth()

      // Wait 5 seconds then scroll to 50%
      jest.advanceTimersByTime(5000)
      
      Object.defineProperty(window, 'pageYOffset', { value: 2500 })
      window.dispatchEvent(new Event('scroll'))

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringMatching(/timeToReach":\s*5/)
      })

      jest.useRealTimers()
    })

    it('should throttle scroll events', () => {
      jest.useFakeTimers()
      
      const tracker = new AnalyticsTracker({ 
        batchSize: 100,
        scrollThrottle: 1000 
      })
      tracker.trackScrollDepth()

      // Scroll multiple times rapidly
      for (let i = 0; i < 10; i++) {
        Object.defineProperty(window, 'pageYOffset', { value: i * 100 })
        window.dispatchEvent(new Event('scroll'))
      }

      jest.runAllTimers()
      
      // Should only track once per throttle period
      expect(fetch).toHaveBeenCalledTimes(1)

      jest.useRealTimers()
    })
  })

  describe('Error Tracking', () => {
    it('should track JavaScript errors', () => {
      const tracker = new AnalyticsTracker({ 
        batchSize: 100,
        enableErrorTracking: true 
      })
      tracker.trackErrors()

      const error = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 42,
        colno: 13,
        error: new Error('Test error')
      })
      window.dispatchEvent(error)

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining(JSON.stringify({
          eventName: 'error',
          properties: expect.objectContaining({
            message: 'Test error',
            source: 'test.js',
            line: 42,
            column: 13
          })
        }))
      })
    })

    it('should track unhandled promise rejections', () => {
      const tracker = new AnalyticsTracker({ 
        batchSize: 100,
        enableErrorTracking: true 
      })
      tracker.trackErrors()

      const rejection = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject('Test rejection'),
        reason: 'Test rejection'
      })
      window.dispatchEvent(rejection)

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining('promise_rejection')
      })
    })
  })

  describe('Performance Tracking', () => {
    it('should track page load performance', () => {
      // Mock performance timing
      Object.defineProperty(window.performance, 'timing', {
        value: {
          navigationStart: 1000,
          domContentLoadedEventEnd: 2500,
          loadEventEnd: 3000
        }
      })

      const tracker = new AnalyticsTracker({ 
        batchSize: 100,
        enablePerformanceTracking: true 
      })
      tracker.trackPerformance()

      expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining(JSON.stringify({
          eventName: 'performance',
          properties: expect.objectContaining({
            domReady: 1500,
            pageLoad: 2000
          })
        }))
      })
    })
  })
})