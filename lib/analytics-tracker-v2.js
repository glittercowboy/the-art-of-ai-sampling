// ABOUTME: Enhanced analytics tracker with batching and advanced event tracking
// ABOUTME: Provides event batching, enhanced click/form/scroll tracking, and error monitoring

class AnalyticsTrackerV2 {
  constructor(config = {}) {
    this.config = {
      endpoint: config.endpoint || '/api/analytics/track',
      batchEndpoint: config.batchEndpoint || '/api/analytics/batch',
      batchSize: config.batchSize || 20,
      flushInterval: config.flushInterval || 5000,
      clickDebounce: config.clickDebounce || 500,
      scrollThrottle: config.scrollThrottle || 1000,
      enableAutoTracking: config.enableAutoTracking === true, // Default to false for testing
      enableErrorTracking: config.enableErrorTracking !== false,
      enablePerformanceTracking: config.enablePerformanceTracking !== false,
      debug: config.debug || false
    }
    
    // Event queue for batching
    this.queue = []
    this.flushTimer = null
    
    // Tracking state
    this.sessionId = this.getOrCreateSessionId()
    this.startTime = Date.now()
    this.maxScrollDepth = 0
    this.scrollMilestones = new Set()
    this.formInteractions = new Map()
    this.clickDebounceTimers = new Map()
    
    // Initialize tracking
    this.init()
  }

  init() {
    // Set up flush interval
    this.startFlushTimer()
    
    // Set up unload handler
    this.setupUnloadHandler()
    
    // Auto-enable tracking features
    if (this.config.enableAutoTracking) {
      if (typeof window !== 'undefined' && window.document) {
        // Wait for DOM ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.enableAutoTracking())
        } else {
          this.enableAutoTracking()
        }
      }
    }
  }

  enableAutoTracking() {
    this.trackPageView()
    this.trackClicks()
    this.trackScrollDepth()
    this.trackEngagementTime()
    
    if (this.config.enableErrorTracking) {
      this.trackErrors()
    }
    
    if (this.config.enablePerformanceTracking) {
      this.trackPerformance()
    }
  }

  // Core tracking method with batching
  track(eventName, properties = {}) {
    const event = {
      eventId: this.generateId(),
      eventName,
      eventType: this.getEventType(eventName),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height
        }
      }
    }
    
    // Add to queue
    this.queue.push(event)
    
    if (this.config.debug) {
      console.log('[Analytics]', eventName, properties)
    }
    
    // Flush if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      this.flush()
    }
  }

  // Flush event queue
  async flush() {
    if (this.queue.length === 0) return
    
    // Get events to send
    const events = this.queue.splice(0)
    
    try {
      const response = await fetch(this.config.batchEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      })
      
      if (!response.ok && this.config.debug) {
        console.error('[Analytics] Batch send failed:', response.status)
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[Analytics] Batch send error:', error)
      }
      
      // On error, try to send events individually as fallback
      for (const event of events) {
        this.sendSingleEvent(event)
      }
    }
    
    // Reset flush timer
    this.startFlushTimer()
  }

  // Send single event (fallback)
  async sendSingleEvent(event) {
    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (error) {
      // Silently fail
    }
  }

  // Start flush timer
  startFlushTimer() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }
    
    this.flushTimer = setTimeout(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  // Set up unload handler for last-chance flush
  setupUnloadHandler() {
    // Try multiple methods for reliability
    const handlers = ['beforeunload', 'unload', 'pagehide']
    
    handlers.forEach(event => {
      window.addEventListener(event, () => {
        // Use sendBeacon if available for reliability
        if (navigator.sendBeacon && this.queue.length > 0) {
          const data = JSON.stringify({ events: this.queue })
          navigator.sendBeacon(this.config.batchEndpoint, data)
          this.queue = []
        } else {
          // Fallback to sync flush
          this.flush()
        }
      })
    })
  }

  // Track page view
  trackPageView() {
    const urlParams = new URLSearchParams(window.location.search)
    
    this.track('page_view', {
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_content: urlParams.get('utm_content'),
      utm_term: urlParams.get('utm_term')
    })
  }

  // Enhanced click tracking
  trackClicks(selector = '[data-track]') {
    document.addEventListener('click', (event) => {
      const trackableElement = event.target.closest(selector)
      
      if (trackableElement) {
        // Debounce rapid clicks on same element
        const elementId = this.getElementIdentifier(trackableElement)
        
        if (this.clickDebounceTimers.has(elementId)) {
          return
        }
        
        // Set debounce timer
        this.clickDebounceTimers.set(elementId, setTimeout(() => {
          this.clickDebounceTimers.delete(elementId)
        }, this.config.clickDebounce))
        
        // Extract tracking data
        const trackingData = {
          action: trackableElement.dataset.trackAction || 'click',
          label: trackableElement.dataset.trackLabel || trackableElement.textContent?.trim(),
          text: trackableElement.textContent?.trim(),
          element: trackableElement.tagName,
          x: event.clientX,
          y: event.clientY
        }
        
        // Add optional properties if they exist
        if (trackableElement.href) {
          trackingData.href = trackableElement.href
        }
        if (event.pageX !== undefined) {
          trackingData.pageX = event.pageX
          trackingData.pageY = event.pageY
        }
        
        // Special handling for checkout buttons
        if (trackableElement.classList.contains('checkout-button')) {
          trackingData.action = 'checkout_click'
        }
        
        this.track('click', trackingData)
      }
    }, true)
  }

  // Form interaction tracking
  trackForms(selector = 'form') {
    const forms = document.querySelectorAll(selector)
    
    forms.forEach(form => {
      const formId = form.id || this.getElementIdentifier(form)
      const formData = {
        startTime: null,
        fields: new Map(),
        abandoned: false
      }
      
      this.formInteractions.set(formId, formData)
      
      // Track form start
      form.addEventListener('focusin', (event) => {
        if (!formData.startTime && event.target.matches('input, textarea, select')) {
          formData.startTime = Date.now()
          
          this.track('form_start', {
            formId,
            formName: form.name,
            firstField: event.target.name
          })
        }
        
        // Track field focus
        const fieldName = event.target.name
        if (fieldName && !formData.fields.has(fieldName)) {
          formData.fields.set(fieldName, {
            focusTime: Date.now(),
            blurTime: null,
            completed: false
          })
        }
      })
      
      // Track field completion
      form.addEventListener('focusout', (event) => {
        const fieldName = event.target.name
        const fieldData = formData.fields.get(fieldName)
        
        if (fieldData) {
          fieldData.blurTime = Date.now()
          fieldData.completed = event.target.value.length > 0
          
          const timeSpent = Math.round((fieldData.blurTime - fieldData.focusTime) / 1000)
          
          if (fieldData.completed) {
            this.track('form_field_complete', {
              formId,
              fieldName,
              timeSpent
            })
          }
        }
      })
      
      // Track form submission
      form.addEventListener('submit', (event) => {
        const totalTime = formData.startTime ? 
          Math.round((Date.now() - formData.startTime) / 1000) : 0
        
        const completedFields = Array.from(formData.fields.entries())
          .filter(([_, data]) => data.completed)
          .map(([name]) => name)
        
        this.track('form_submit', {
          formId,
          formName: form.name,
          totalTime,
          completedFields,
          fieldCount: completedFields.length
        })
        
        formData.abandoned = false
      })
    })
    
    // Track form abandonment on page unload
    window.addEventListener('beforeunload', () => {
      this.formInteractions.forEach((formData, formId) => {
        if (formData.startTime && !formData.abandoned) {
          const completedFields = Array.from(formData.fields.entries())
            .filter(([_, data]) => data.completed)
            .map(([name]) => name)
          
          if (completedFields.length > 0) {
            this.track('form_abandon', {
              formId,
              completedFields,
              lastField: completedFields[completedFields.length - 1]
            })
          }
        }
      })
    })
  }

  // Scroll depth tracking
  trackScrollDepth(options = {}) {
    const milestones = options.milestones || [10, 25, 50, 75, 90, 100]
    let scrollTimer = null
    let lastScrollTime = Date.now()
    
    const checkScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / scrollHeight) * 100)
      
      // Update max scroll depth
      if (scrollPercent > this.maxScrollDepth) {
        this.maxScrollDepth = scrollPercent
        
        // Check milestones
        milestones.forEach(milestone => {
          if (scrollPercent >= milestone && !this.scrollMilestones.has(milestone)) {
            this.scrollMilestones.add(milestone)
            
            const timeToReach = Math.round((Date.now() - this.startTime) / 1000)
            
            this.track('scroll_depth', {
              depth: milestone,
              maxDepth: this.maxScrollDepth,
              timeToReach,
              pageHeight: document.documentElement.scrollHeight
            })
          }
        })
      }
    }
    
    // Throttled scroll handler
    window.addEventListener('scroll', () => {
      if (scrollTimer) return
      
      scrollTimer = setTimeout(() => {
        checkScrollDepth()
        lastScrollTime = Date.now()
        scrollTimer = null
      }, this.config.scrollThrottle)
    })
    
    // Check initial scroll position
    checkScrollDepth()
  }

  // Engagement time tracking
  trackEngagementTime() {
    let engagementStart = Date.now()
    let totalEngagement = 0
    let lastReportedEngagement = 0
    
    // Send engagement updates periodically (every 30 seconds)
    const engagementInterval = setInterval(() => {
      if (!document.hidden) {
        const currentEngagement = totalEngagement + (Date.now() - engagementStart)
        const engagementSeconds = Math.round(currentEngagement / 1000)
        
        // Only send if engagement has increased by at least 5 seconds
        if (engagementSeconds - lastReportedEngagement >= 5) {
          this.track('engagement_time', {
            duration: engagementSeconds,
            maxScrollDepth: this.maxScrollDepth,
            incremental: true
          })
          lastReportedEngagement = engagementSeconds
        }
      }
    }, 30000) // Every 30 seconds
    
    // Track when page is visible/hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page hidden, record engagement
        totalEngagement += Date.now() - engagementStart
      } else {
        // Page visible again
        engagementStart = Date.now()
      }
    })
    
    // Send engagement time on unload
    window.addEventListener('beforeunload', () => {
      if (!document.hidden) {
        totalEngagement += Date.now() - engagementStart
      }
      
      if (totalEngagement > 0) {
        const engagementEvent = {
          eventId: this.generateId(),
          eventName: 'engagement_time',
          eventType: 'engagement',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          properties: {
            duration: Math.round(totalEngagement / 1000),
            maxScrollDepth: this.maxScrollDepth
          }
        }
        
        // Try to send immediately with sendBeacon
        if (navigator.sendBeacon) {
          const data = JSON.stringify({ events: [engagementEvent] })
          navigator.sendBeacon(this.config.batchEndpoint, data)
        } else {
          // Fallback: add to queue
          this.track('engagement_time', {
            duration: Math.round(totalEngagement / 1000),
            maxScrollDepth: this.maxScrollDepth
          })
        }
      }
    })
  }

  // Error tracking
  trackErrors() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.track('error', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        type: 'javascript_error'
      })
    })
    
    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.track('error', {
        message: event.reason?.toString() || 'Unknown promise rejection',
        type: 'promise_rejection'
      })
    })
  }

  // Performance tracking
  trackPerformance() {
    if (window.performance && window.performance.timing) {
      // Wait for page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing
          const navigation = window.performance.navigation
          
          this.track('performance', {
            // Page load metrics
            domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
            pageLoad: timing.loadEventEnd - timing.navigationStart,
            
            // Network metrics
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            ttfb: timing.responseStart - timing.navigationStart,
            
            // DOM metrics
            domParse: timing.domInteractive - timing.domLoading,
            domComplete: timing.domComplete - timing.domInteractive,
            
            // Navigation type
            navigationType: navigation.type,
            redirectCount: navigation.redirectCount
          })
        }, 0)
      })
    }
  }

  // Utility methods
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  getOrCreateSessionId() {
    const key = 'analytics_session_id'
    let sessionId = sessionStorage.getItem(key)
    
    if (!sessionId) {
      sessionId = this.generateId()
      sessionStorage.setItem(key, sessionId)
    }
    
    return sessionId
  }

  getElementIdentifier(element) {
    return element.id || 
           element.className || 
           `${element.tagName}-${Array.from(element.parentNode.children).indexOf(element)}`
  }

  getEventType(eventName) {
    const typeMap = {
      page_view: 'pageview',
      click: 'interaction',
      form_start: 'form',
      form_submit: 'conversion',
      error: 'error',
      performance: 'performance'
    }
    
    return typeMap[eventName] || 'custom'
  }

  // Public API for custom tracking
  identify(userId, traits = {}) {
    this.track('identify', {
      userId,
      traits
    })
  }

  page(name, properties = {}) {
    this.track('page', {
      name,
      ...properties
    })
  }

  startExperiment(experimentId, variant) {
    this.track('experiment_view', {
      experimentId,
      variant
    })
  }

  trackRevenue(amount, properties = {}) {
    this.track('revenue', {
      amount,
      currency: properties.currency || 'USD',
      ...properties
    })
  }
}

// Export for use
export default AnalyticsTrackerV2

// Auto-initialize if configured
if (typeof window !== 'undefined' && window.ANALYTICS_CONFIG) {
  window.analytics = new AnalyticsTrackerV2(window.ANALYTICS_CONFIG)
}