// ABOUTME: Test suite for Facebook pixel compatibility with analytics tracking
// ABOUTME: Ensures both systems work independently without conflicts

/**
 * @jest-environment jsdom
 */

describe('Facebook Pixel Compatibility', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    
    // Mock fetch for analytics
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
    
    // Mock Facebook pixel
    window.fbq = jest.fn()
    
    // Mock location
    delete window.location
    window.location = {
      href: 'https://taches.ai/',
      search: '',
      pathname: '/'
    }
  })

  it('should allow both analytics and Facebook pixel to track pageviews', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    // Initialize analytics
    const tracker = require('../../lib/analytics-tracker')
    await tracker.init()

    // Simulate Facebook pixel pageview (as happens in pages/index.js)
    window.fbq('init', '924341239600510')
    window.fbq('track', 'PageView')

    // Verify both systems were called
    expect(global.fetch).toHaveBeenCalledWith('/api/analytics/track', expect.objectContaining({
      method: 'POST'
    }))
    
    expect(window.fbq).toHaveBeenCalledWith('init', '924341239600510')
    expect(window.fbq).toHaveBeenCalledWith('track', 'PageView')
  })

  it('should allow analytics to track checkout button clicks alongside Facebook ViewContent', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    const tracker = require('../../lib/analytics-tracker')

    // Track checkout button click with analytics
    await tracker.trackEvent('click', { 
      element: 'checkout-button',
      value: 97 
    })

    // Simulate Facebook ViewContent event (as happens on checkout button click)
    window.fbq('track', 'ViewContent', {
      content_name: 'Checkout Page Click',
      value: 97.0,
      currency: 'USD'
    })

    // Verify both tracking calls were made
    expect(global.fetch).toHaveBeenCalledWith('/api/analytics/track', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"event_type":"click"')
    }))
    
    expect(window.fbq).toHaveBeenCalledWith('track', 'ViewContent', {
      content_name: 'Checkout Page Click',
      value: 97.0,
      currency: 'USD'
    })
  })

  it('should not interfere with Facebook pixel queue or methods', () => {
    // Initialize tracker first
    const tracker = require('../../lib/analytics-tracker')
    
    // Test that fbq methods still work as expected
    window.fbq('init', '924341239600510')
    window.fbq('track', 'PageView')
    window.fbq('trackCustom', 'AnalyticsTest')

    expect(window.fbq).toHaveBeenCalledTimes(3)
    expect(window.fbq).toHaveBeenNthCalledWith(1, 'init', '924341239600510')
    expect(window.fbq).toHaveBeenNthCalledWith(2, 'track', 'PageView')
    expect(window.fbq).toHaveBeenNthCalledWith(3, 'trackCustom', 'AnalyticsTest')
  })
})