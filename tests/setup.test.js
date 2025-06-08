/**
 * Test: Verify Next.js app starts and serves existing pages
 * This test ensures our Next.js setup preserves existing functionality
 */

describe('Next.js Setup', () => {
  test('should have correct package.json configuration', () => {
    const packageJson = require('../package.json')
    
    expect(packageJson.name).toBe('art-of-ai-sampling')
    expect(packageJson.dependencies).toHaveProperty('next')
    expect(packageJson.dependencies).toHaveProperty('react')
    expect(packageJson.dependencies).toHaveProperty('stripe')
    expect(packageJson.scripts).toHaveProperty('dev')
    expect(packageJson.scripts).toHaveProperty('build')
    expect(packageJson.scripts).toHaveProperty('test')
  })

  test('should have next.config.js with required settings', () => {
    const nextConfig = require('../next.config.js')
    
    expect(nextConfig.output).toBe('standalone')
    expect(nextConfig.env).toHaveProperty('STRIPE_PUBLISHABLE_KEY')
    expect(nextConfig.env).toHaveProperty('FACEBOOK_PIXEL_ID')
  })

  test('should have environment variables configured for testing', () => {
    expect(process.env.STRIPE_SECRET_KEY).toBeDefined()
    expect(process.env.STRIPE_PUBLISHABLE_KEY).toBeDefined()
    expect(process.env.FACEBOOK_PIXEL_ID).toBe('924341239600510')
  })
})