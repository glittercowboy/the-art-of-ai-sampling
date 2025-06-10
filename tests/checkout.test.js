/**
 * Test: Checkout form functionality
 * This test ensures the checkout form validation and integration works
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import StripeCheckout from '../components/StripeCheckout'

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    confirmPayment: jest.fn()
  }))
}))

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => children,
  useStripe: () => ({
    confirmPayment: jest.fn()
  }),
  useElements: () => ({}),
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  AddressElement: () => <div data-testid="address-element">Address Element</div>
}))

// Mock sale-config
jest.mock('../lib/sale-config', () => ({
  getCurrentPricing: jest.fn(() => ({
    price: 97,
    stripePriceId: 'price_1RXnr4Gk1M5Eg2svb9riyGQv',
    isOnSale: false,
    sale: null
  }))
}))

// Mock fetch
global.fetch = jest.fn()

describe('StripeCheckout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  test('should not render when not visible', () => {
    render(<StripeCheckout isVisible={false} onClose={() => {}} />)
    expect(screen.queryByText('Complete Your Purchase')).not.toBeInTheDocument()
  })

  test('should render email form when visible', () => {
    render(<StripeCheckout isVisible={true} onClose={() => {}} />)
    
    expect(screen.getByText('Complete Your Purchase')).toBeInTheDocument()
    expect(screen.getByText('The Art of AI Sampling Course - $98')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByText('Continue to Payment')).toBeInTheDocument()
  })

  test('should validate required fields', async () => {
    render(<StripeCheckout isVisible={true} onClose={() => {}} />)
    
    const form = screen.getByTestId('email-form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter both your email and name.')).toBeInTheDocument()
    })
  })

  test('should create payment intent on form submission', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: 'pi_test_secret' })
    })
    
    render(<StripeCheckout isVisible={true} onClose={() => {}} />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' }
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' }
    })
    
    // Submit form
    fireEvent.click(screen.getByText('Continue to Payment'))
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'test@example.com', 
          name: 'Test User' 
        }),
      })
    })
  })

  test('should show payment form after successful payment intent creation', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ clientSecret: 'pi_test_secret' })
    })
    
    render(<StripeCheckout isVisible={true} onClose={() => {}} />)
    
    // Fill and submit email form
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' }
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.click(screen.getByText('Continue to Payment'))
    
    // Wait for payment form to appear
    await waitFor(() => {
      expect(screen.getByTestId('payment-element')).toBeInTheDocument()
      expect(screen.getByTestId('address-element')).toBeInTheDocument()
      expect(screen.getByText('Pay $98')).toBeInTheDocument()
    })
  })

  test('should handle API errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Payment setup failed' })
    })
    
    render(<StripeCheckout isVisible={true} onClose={() => {}} />)
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' }
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.click(screen.getByText('Continue to Payment'))
    
    await waitFor(() => {
      expect(screen.getByText('Payment setup failed')).toBeInTheDocument()
    })
  })

  test('should call onClose when close button is clicked', () => {
    const mockOnClose = jest.fn()
    render(<StripeCheckout isVisible={true} onClose={mockOnClose} />)
    
    fireEvent.click(screen.getByText('×'))
    expect(mockOnClose).toHaveBeenCalled()
  })
})