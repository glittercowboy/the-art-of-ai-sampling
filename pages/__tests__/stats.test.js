// ABOUTME: Tests for stats dashboard page including connection status display
// ABOUTME: Verifies authentication, data display, and Redis connection indicator

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import StatsPage from '../stats'
import { useRouter } from 'next/router'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

describe('Stats Dashboard', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    useRouter.mockReturnValue({
      push: mockPush
    })
    fetch.mockClear()
    mockPush.mockClear()
    
    // Clear localStorage
    global.localStorage.clear()
  })

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', () => {
      render(<StatsPage />)
      expect(mockPush).toHaveBeenCalledWith('/stats/login')
    })

    it('should show dashboard if authenticated', async () => {
      // Set auth token
      global.localStorage.setItem('stats_auth', 'valid-token')
      
      // Mock successful stats API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visitors: { total: 100, today: 20, unique: 50 },
          connectionStatus: { connected: true, type: 'redis' }
        })
      })
      
      render(<StatsPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument()
      })
    })
  })

  describe('Connection Status Display', () => {
    beforeEach(() => {
      global.localStorage.setItem('stats_auth', 'valid-token')
    })

    it('should display Redis connection status', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visitors: { total: 100 },
          connectionStatus: { 
            connected: true, 
            type: 'redis' 
          }
        })
      })
      
      render(<StatsPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/Connected to Redis/i)).toBeInTheDocument()
        expect(screen.getByTestId('connection-indicator')).toHaveClass('connected')
      })
    })

    it('should show warning when using in-memory storage', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visitors: { total: 0 },
          connectionStatus: { 
            connected: true, 
            type: 'memory' 
          }
        })
      })
      
      render(<StatsPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/Using In-Memory Storage/i)).toBeInTheDocument()
        expect(screen.getByText(/Data will be lost on restart/i)).toBeInTheDocument()
        expect(screen.getByTestId('connection-indicator')).toHaveClass('warning')
      })
    })

    it('should show error when disconnected', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visitors: { total: 0 },
          connectionStatus: { 
            connected: false, 
            type: 'none',
            error: 'Connection failed' 
          }
        })
      })
      
      render(<StatsPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/Disconnected/i)).toBeInTheDocument()
        expect(screen.getByText(/Connection failed/i)).toBeInTheDocument()
        expect(screen.getByTestId('connection-indicator')).toHaveClass('error')
      })
    })
  })

  describe('Data Display', () => {
    beforeEach(() => {
      global.localStorage.setItem('stats_auth', 'valid-token')
    })

    it('should display visitor metrics', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visitors: { 
            total: 1234, 
            today: 56, 
            unique: 789 
          },
          connectionStatus: { connected: true, type: 'redis' }
        })
      })
      
      render(<StatsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('1,234')).toBeInTheDocument()
        expect(screen.getByText('56')).toBeInTheDocument()
        expect(screen.getByText('789')).toBeInTheDocument()
      })
    })

    it('should show last update time', async () => {
      const now = new Date()
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visitors: { total: 100 },
          connectionStatus: { connected: true, type: 'redis' },
          lastUpdated: now.toISOString()
        })
      })
      
      render(<StatsPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/Last updated:/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      global.localStorage.setItem('stats_auth', 'valid-token')
    })

    it('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))
      
      render(<StatsPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load analytics/i)).toBeInTheDocument()
      })
    })

    it('should handle 401 unauthorized', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      })
      
      render(<StatsPage />)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/stats/login')
      })
    })
  })

  describe('Real-time Updates', () => {
    beforeEach(() => {
      global.localStorage.setItem('stats_auth', 'valid-token')
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should poll for updates when page is visible', async () => {
      // Initial load
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visitors: { total: 100 },
          connectionStatus: { connected: true, type: 'redis' }
        })
      })
      
      // Updated data
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          visitors: { total: 105 },
          connectionStatus: { connected: true, type: 'redis' }
        })
      })
      
      render(<StatsPage />)
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument()
      })
      
      // Fast-forward 10 seconds (polling interval)
      jest.advanceTimersByTime(10000)
      
      // Wait for update
      await waitFor(() => {
        expect(screen.getByText('105')).toBeInTheDocument()
      })
      
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })
})