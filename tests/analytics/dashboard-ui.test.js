// ABOUTME: Test suite for analytics dashboard UI components and rendering
// ABOUTME: Ensures dashboard displays metrics correctly and handles authentication

/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js router
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  pathname: '/stats',
  query: {},
}

jest.mock('next/router', () => ({
  useRouter: () => mockRouter
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Analytics Dashboard UI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockClear()
  })

  describe('Dashboard Page Authentication', () => {
    it('should show login form when not authenticated', async () => {
      // This will fail until we create the dashboard page
      const Dashboard = require('../../pages/stats').default
      
      render(<Dashboard />)
      
      expect(screen.getByText('Analytics Dashboard Login')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    })

    it('should handle login form submission', async () => {
      const Dashboard = require('../../pages/stats').default
      const { getByLabelText, getByRole } = render(<Dashboard />)
      
      const passwordInput = getByLabelText('Password')
      const loginButton = getByRole('button', { name: 'Login' })
      
      // Simulate typing password
      fireEvent.change(passwordInput, { target: { value: 'test-password' } })
      
      // Mock successful login
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visitors: { total: 100, today: 25, unique: 80 },
          clicks: { total: 15, today: 5, rate: 15 },
          conversions: { total: 2, rate: 13.3, revenue: 194 },
          averageTime: 120,
          scrollDepth: { average: 65, distribution: [] },
          timeline: [],
          lastUpdated: new Date().toISOString()
        })
      })
      
      // Simulate login
      loginButton.click()
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/stats', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-password'
          }
        })
      })
    })

    it('should show error message for invalid password', async () => {
      const Dashboard = require('../../pages/stats').default
      const { getByLabelText, getByRole } = render(<Dashboard />)
      
      const passwordInput = getByLabelText('Password')
      const loginButton = getByRole('button', { name: 'Login' })
      
      fireEvent.change(passwordInput, { target: { value: 'wrong-password' } })
      
      // Mock failed login
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      })
      
      loginButton.click()
      
      await waitFor(() => {
        expect(screen.getByText('Invalid password')).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Metrics Display', () => {
    beforeEach(() => {
      // Mock successful authentication and data fetch
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          visitors: { total: 156, today: 42, unique: 128 },
          clicks: { total: 23, today: 8, rate: 14.7 },
          conversions: { total: 3, rate: 13.0, revenue: 291 },
          averageTime: 145,
          scrollDepth: { 
            average: 72, 
            distribution: [
              { depth: 25, count: 45 },
              { depth: 50, count: 32 },
              { depth: 75, count: 28 },
              { depth: 100, count: 18 }
            ]
          },
          timeline: [
            { date: '2024-01-01', visitors: 25, clicks: 4 },
            { date: '2024-01-02', visitors: 42, clicks: 8 }
          ],
          lastUpdated: new Date().toISOString()
        })
      })
    })

    it('should display visitor metrics correctly', async () => {
      const Dashboard = require('../../pages/stats').default
      render(<Dashboard authenticated={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('156')).toBeInTheDocument() // Total visitors
        expect(screen.getByText('42')).toBeInTheDocument()  // Today's visitors
        expect(screen.getByText('128')).toBeInTheDocument() // Unique visitors
      })
      
      expect(screen.getByText('Total Visitors')).toBeInTheDocument()
      expect(screen.getByText("Today's Visitors")).toBeInTheDocument()
      expect(screen.getByText('Unique Visitors')).toBeInTheDocument()
    })

    it('should display click metrics correctly', async () => {
      const Dashboard = require('../../pages/stats').default
      render(<Dashboard authenticated={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('23')).toBeInTheDocument()    // Total clicks
        expect(screen.getByText('8')).toBeInTheDocument()     // Today's clicks
        expect(screen.getByText('14.7%')).toBeInTheDocument() // Click rate
      })
      
      expect(screen.getByText('Total Clicks')).toBeInTheDocument()
      expect(screen.getByText("Today's Clicks")).toBeInTheDocument()
      expect(screen.getByText('Click Rate')).toBeInTheDocument()
    })

    it('should display conversion metrics correctly', async () => {
      const Dashboard = require('../../pages/stats').default
      render(<Dashboard authenticated={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()      // Total conversions
        expect(screen.getByText('13.0%')).toBeInTheDocument()  // Conversion rate
        expect(screen.getByText('$291')).toBeInTheDocument()   // Revenue
      })
      
      expect(screen.getByRole('heading', { name: 'Conversions' })).toBeInTheDocument()
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })

    it('should display engagement metrics correctly', async () => {
      const Dashboard = require('../../pages/stats').default
      render(<Dashboard authenticated={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('2m 25s')).toBeInTheDocument() // Average time (145 seconds)
        expect(screen.getByText('72%')).toBeInTheDocument()    // Average scroll depth
      })
      
      expect(screen.getByText('Average Time on Page')).toBeInTheDocument()
      expect(screen.getByText('Average Scroll Depth')).toBeInTheDocument()
    })

    it('should display scroll depth distribution', async () => {
      const Dashboard = require('../../pages/stats').default
      render(<Dashboard authenticated={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument() // 25% depth count
        expect(screen.getByText('32')).toBeInTheDocument() // 50% depth count
        expect(screen.getByText('28')).toBeInTheDocument() // 75% depth count
        expect(screen.getByText('18')).toBeInTheDocument() // 100% depth count
      })
      
      expect(screen.getByText('Scroll Depth Distribution')).toBeInTheDocument()
    })

    it('should show last updated timestamp', async () => {
      const Dashboard = require('../../pages/stats').default
      render(<Dashboard authenticated={true} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
      })
    })

    it('should handle loading state', async () => {
      const Dashboard = require('../../pages/stats').default
      
      // Make fetch return a pending promise
      let resolvePromise
      global.fetch.mockReturnValue(new Promise(resolve => {
        resolvePromise = resolve
      }))
      
      render(<Dashboard authenticated={true} />)
      
      expect(screen.getByText('Loading analytics data...')).toBeInTheDocument()
      
      // Resolve the promise
      resolvePromise({
        ok: true,
        json: async () => ({
          visitors: { total: 0, today: 0, unique: 0 },
          clicks: { total: 0, today: 0, rate: 0 },
          conversions: { total: 0, rate: 0, revenue: 0 },
          averageTime: 0,
          scrollDepth: { average: 0, distribution: [] },
          timeline: [],
          lastUpdated: new Date().toISOString()
        })
      })
      
      await waitFor(() => {
        expect(screen.queryByText('Loading analytics data...')).not.toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully', async () => {
      const Dashboard = require('../../pages/stats').default
      
      global.fetch.mockRejectedValue(new Error('Network error'))
      
      render(<Dashboard authenticated={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('Error loading analytics data')).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Responsive Design', () => {
    it('should be mobile responsive', async () => {
      const Dashboard = require('../../pages/stats').default
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<Dashboard authenticated={true} />)
      
      await waitFor(() => {
        const dashboard = screen.getByTestId('analytics-dashboard')
        expect(dashboard).toHaveClass('mobile-responsive')
      })
    })
  })
})