/**
 * Test: Retry utility functionality
 * This test ensures retry logic works correctly for webhook integrations
 */

import { retryWithBackoff } from '../lib/retry'

// Mock console.log to avoid noise during tests
global.console = {
  ...console,
  log: jest.fn()
}

describe('Retry Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should succeed on first attempt when no error', async () => {
    const mockFn = jest.fn().mockResolvedValue('success')
    
    const promise = retryWithBackoff(mockFn, 3, 1000)
    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  test('should retry on failure and eventually succeed', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Server error (500)'))
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValue('success')

    const result = await retryWithBackoff(mockFn, 3, 10) // Very short delay for testing

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  test('should fail after max retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'))

    await expect(retryWithBackoff(mockFn, 2, 10)).rejects.toThrow('Persistent error')
    expect(mockFn).toHaveBeenCalledTimes(3) // Initial call + 2 retries
  })

  test('should not retry on client errors (4xx)', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Client error (400): Bad request'))

    await expect(retryWithBackoff(mockFn, 3, 10)).rejects.toThrow('Client error (400)')
    expect(mockFn).toHaveBeenCalledTimes(1) // No retries
  })

  test('should retry on server errors (5xx)', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Server error (500)'))
      .mockResolvedValue('success')

    const result = await retryWithBackoff(mockFn, 3, 10)
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  test('should retry on timeout errors even if they look like 4xx', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Request timeout (408)'))
      .mockResolvedValue('success')

    const result = await retryWithBackoff(mockFn, 3, 10)
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  test('should use exponential backoff with jitter', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValue('success')

    await retryWithBackoff(mockFn, 3, 10)

    // Should have logged retry attempts
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/Retry attempt 1\/3 after \d+ms delay/)
    )
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/Retry attempt 2\/3 after \d+ms delay/)
    )
  })
})