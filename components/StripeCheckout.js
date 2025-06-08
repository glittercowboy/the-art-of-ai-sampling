// ABOUTME: Stripe checkout wrapper that loads Stripe.js and handles payment intent creation
// ABOUTME: Manages the complete checkout flow including form submission and loading states

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import CheckoutForm from './CheckoutForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function StripeCheckout({ isVisible, onClose }) {
  const [clientSecret, setClientSecret] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !name) {
      setError('Please enter both your email and name.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment setup failed')
      }

      setClientSecret(data.clientSecret)
      setShowForm(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setShowForm(false)
    setClientSecret('')
    setEmail('')
    setName('')
    setError('')
    onClose()
  }

  if (!isVisible) return null

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#e6ac55',
      colorBackground: '#ffffff',
      colorText: '#000000',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '6px',
      borderRadius: '8px',
    },
  }

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <div className="checkout-overlay">
      <div className="checkout-modal">
        <button className="close-btn" onClick={handleClose}>×</button>
        
        <h2>Complete Your Purchase</h2>
        <p className="course-info">The Art of AI Sampling Course - $98</p>
        
        {!showForm ? (
          <form onSubmit={handleEmailSubmit} className="email-form" data-testid="email-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" disabled={isLoading} className="continue-btn">
              {isLoading ? 'Setting up payment...' : 'Continue to Payment'}
            </button>
          </form>
        ) : (
          clientSecret && (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm 
                clientSecret={clientSecret}
                email={email}
                name={name}
              />
            </Elements>
          )
        )}
      </div>
      
      <style jsx>{`
        .checkout-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .checkout-modal {
          background: white;
          padding: 32px;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }
        
        .close-btn {
          position: absolute;
          top: 16px;
          right: 20px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        
        .close-btn:hover {
          color: #000;
        }
        
        h2 {
          margin: 0 0 8px 0;
          color: #000;
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
        }
        
        .course-info {
          color: #666;
          margin-bottom: 24px;
          font-size: 16px;
        }
        
        .email-form {
          display: flex;
          flex-direction: column;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
        }
        
        input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          font-family: 'Inter', sans-serif;
        }
        
        input:focus {
          outline: none;
          border-color: #e6ac55;
          box-shadow: 0 0 0 2px rgba(230, 172, 85, 0.2);
        }
        
        .continue-btn {
          background: #e6ac55;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .continue-btn:hover:not(:disabled) {
          background: #d69a47;
        }
        
        .continue-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #df1b41;
          font-size: 14px;
          margin-bottom: 16px;
          padding: 12px;
          background: #fdf2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
        }
      `}</style>
    </div>
  )
}