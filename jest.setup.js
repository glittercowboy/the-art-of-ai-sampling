import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret'
process.env.FACEBOOK_PIXEL_ID = '924341239600510'
process.env.FACEBOOK_ACCESS_TOKEN = 'mock_facebook_token'
process.env.GHL_WEBHOOK_URL = 'https://mock-ghl-webhook.com'