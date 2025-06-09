// ABOUTME: Retry utility for webhook integrations with exponential backoff
// ABOUTME: Provides robust retry logic for Facebook CAPI and GHL webhook calls

export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Don't retry on client errors (4xx) - only server errors (5xx) and network issues
      if (error.message?.includes('(4') && !error.message?.includes('timeout')) {
        break
      }
      
      // Calculate delay with exponential backoff + jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms delay`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}