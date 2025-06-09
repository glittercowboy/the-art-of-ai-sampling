// ABOUTME: Manual mock for lib/stripe module
// ABOUTME: Provides mocked Stripe instance for testing

const mockStripe = {
  webhooks: {
    constructEvent: jest.fn()
  }
}

export default mockStripe