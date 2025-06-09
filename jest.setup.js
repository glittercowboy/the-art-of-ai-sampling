import '@testing-library/jest-dom'

// Mock fetch globally for tests
global.fetch = jest.fn()

// Mock environment variables for testing
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret'
process.env.FACEBOOK_PIXEL_ID = '924341239600510'
process.env.FACEBOOK_ACCESS_TOKEN = 'mock_facebook_token'
process.env.GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/mGMWF3JpgTd8KeGbjWFM/webhook-trigger/7b5bb466-cd56-48f5-b099-7de5fd74e58a'