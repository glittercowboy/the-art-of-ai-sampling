// ABOUTME: Tests for Facebook attribution data capture functionality
// ABOUTME: Verifies cookie parsing, fbclid handling, and data persistence

import { 
  captureFacebookAttribution, 
  storeFacebookAttribution,
  getStoredFacebookAttribution,
  getFacebookAttribution,
  prepareAttributionPayload
} from '../facebook-attribution'

// Mock the logger
jest.mock('../logger', () => ({
  logger: {
    dev: jest.fn(),
    devWarn: jest.fn()
  }
}))

describe('Facebook Attribution', () => {
  let mockSessionStorage

  beforeEach(() => {
    // Mock sessionStorage
    mockSessionStorage = {
      store: {},
      getItem: jest.fn((key) => mockSessionStorage.store[key] || null),
      setItem: jest.fn((key, value) => { mockSessionStorage.store[key] = value })
    }

    // Mock window properties
    delete window.location
    window.location = {
      search: '',
      href: 'https://taches.ai'
    }

    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    })

    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('captureFacebookAttribution', () => {
    it('should capture fbclid from URL parameters', () => {
      window.location.search = '?fbclid=ABC123XYZ'
      
      const attribution = captureFacebookAttribution()
      
      expect(attribution.fbclid).toBe('ABC123XYZ')
      expect(attribution.fbc).toMatch(/^fb\.1\.\d+\.ABC123XYZ$/)
    })

    it('should capture Facebook cookies', () => {
      document.cookie = '_fbp=fb.1.1234567890.987654321;path=/'
      document.cookie = '_fbc=fb.1.1234567890.ABC123;path=/'
      
      const attribution = captureFacebookAttribution()
      
      expect(attribution.fbp).toBe('fb.1.1234567890.987654321')
      expect(attribution.fbc).toBe('fb.1.1234567890.ABC123')
    })

    it('should capture user agent and source URL', () => {
      window.location.href = 'https://taches.ai/checkout'
      
      const attribution = captureFacebookAttribution()
      
      expect(attribution.userAgent).toBeTruthy()
      expect(attribution.sourceUrl).toBe('https://taches.ai/checkout')
    })

    it('should handle missing cookies gracefully', () => {
      document.cookie = ''
      
      const attribution = captureFacebookAttribution()
      
      expect(attribution.fbp).toBeNull()
      expect(attribution.fbc).toBeNull()
    })

    it('should create fbc cookie from fbclid if not present', () => {
      window.location.search = '?fbclid=TEST123'
      document.cookie = '_fbp=fb.1.1234567890.987654321;path=/' // No _fbc cookie
      
      const attribution = captureFacebookAttribution()
      
      expect(attribution.fbclid).toBe('TEST123')
      expect(attribution.fbc).toMatch(/^fb\.1\.\d+\.TEST123$/)
    })
  })

  describe('storeFacebookAttribution', () => {
    it('should store attribution data in session storage', () => {
      const attribution = {
        fbclid: 'TEST123',
        fbp: 'fb.1.1234567890.987654321',
        fbc: 'fb.1.1234567890.TEST123',
        userAgent: 'Test Browser',
        sourceUrl: 'https://taches.ai'
      }
      
      storeFacebookAttribution(attribution)
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'fb_attribution',
        JSON.stringify(attribution)
      )
    })

    it('should handle storage errors gracefully', () => {
      mockSessionStorage.setItem = jest.fn(() => {
        throw new Error('Storage full')
      })
      
      // Should not throw
      expect(() => {
        storeFacebookAttribution({ fbclid: 'TEST123' })
      }).not.toThrow()
    })
  })

  describe('getStoredFacebookAttribution', () => {
    it('should retrieve stored attribution data', () => {
      const storedData = {
        fbclid: 'STORED123',
        fbp: 'fb.1.1111111111.111111111'
      }
      
      mockSessionStorage.store['fb_attribution'] = JSON.stringify(storedData)
      
      const result = getStoredFacebookAttribution()
      
      expect(result).toEqual(storedData)
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('fb_attribution')
    })

    it('should return null if no data stored', () => {
      const result = getStoredFacebookAttribution()
      
      expect(result).toBeNull()
    })

    it('should handle parse errors gracefully', () => {
      mockSessionStorage.store['fb_attribution'] = 'invalid json'
      
      const result = getStoredFacebookAttribution()
      
      expect(result).toBeNull()
    })
  })

  describe('getFacebookAttribution', () => {
    it('should merge current and stored attribution data', () => {
      // Current data
      window.location.search = '?fbclid=CURRENT123'
      
      // Stored data
      const storedData = {
        fbp: 'fb.1.stored.123',
        userAgent: 'Old Browser'
      }
      mockSessionStorage.store['fb_attribution'] = JSON.stringify(storedData)
      
      const result = getFacebookAttribution()
      
      expect(result.fbclid).toBe('CURRENT123') // Current value
      expect(result.fbp).toBe('fb.1.stored.123') // Stored value
      expect(result.userAgent).toBeTruthy() // Current value (from jsdom)
    })

    it('should prefer current values over stored values', () => {
      document.cookie = '_fbp=fb.1.current.123;path=/'
      
      const storedData = {
        fbp: 'fb.1.stored.123'
      }
      mockSessionStorage.store['fb_attribution'] = JSON.stringify(storedData)
      
      const result = getFacebookAttribution()
      
      expect(result.fbp).toBe('fb.1.current.123')
    })
  })

  describe('prepareAttributionPayload', () => {
    it('should return only non-null values', () => {
      window.location.search = '?fbclid=TEST123'
      document.cookie = '_fbp=fb.1.1234567890.987654321;path=/'
      
      const payload = prepareAttributionPayload()
      
      expect(payload).toHaveProperty('fbclid', 'TEST123')
      expect(payload).toHaveProperty('fbp', 'fb.1.1234567890.987654321')
      expect(payload).toHaveProperty('userAgent')
      expect(payload).toHaveProperty('sourceUrl')
    })

    it('should exclude null values from payload', () => {
      // No fbclid or cookies
      window.location.search = ''
      document.cookie = ''
      
      const payload = prepareAttributionPayload()
      
      expect(payload).not.toHaveProperty('fbclid')
      expect(payload).not.toHaveProperty('fbp')
      expect(payload).not.toHaveProperty('fbc')
      expect(payload).toHaveProperty('userAgent') // Should always have user agent
      expect(payload).toHaveProperty('sourceUrl') // Should always have URL
    })

    it('should store attribution data when preparing payload', () => {
      window.location.search = '?fbclid=STORE123'
      
      prepareAttributionPayload()
      
      expect(mockSessionStorage.setItem).toHaveBeenCalled()
      const storedData = JSON.parse(mockSessionStorage.setItem.mock.calls[0][1])
      expect(storedData.fbclid).toBe('STORE123')
    })
  })
})