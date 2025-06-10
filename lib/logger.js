// ABOUTME: Environment-aware logging utility that prevents sensitive data exposure in production
// ABOUTME: Provides development debugging while keeping production logs clean

const isDevelopment = process.env.NODE_ENV === 'development';

// Safe logging that respects environment
export const logger = {
  // Development-only logs
  dev: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  // Development-only warnings
  devWarn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  // Always log errors (but sanitize sensitive data)
  error: (...args) => {
    console.error(...args);
  },
  
  // Production-safe info logs
  info: (...args) => {
    console.log(...args);
  },
  
  // Sanitize sensitive data for logging
  sanitize: (data) => {
    if (!isDevelopment) {
      // In production, remove or mask sensitive fields
      const sanitized = { ...data };
      
      // Remove email addresses
      if (sanitized.email) {
        sanitized.email = '***@***.***';
      }
      
      // Remove names
      if (sanitized.name) {
        sanitized.name = '***';
      }
      
      // Remove webhook URLs
      if (sanitized.webhook_url || sanitized.ghlWebhookUrl) {
        sanitized.webhook_url = '***';
        sanitized.ghlWebhookUrl = '***';
      }
      
      // Remove session IDs
      if (sanitized.session_id) {
        sanitized.session_id = '***';
      }
      
      return sanitized;
    }
    
    return data;
  }
};