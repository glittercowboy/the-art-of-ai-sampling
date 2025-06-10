// ABOUTME: Stripe checkout wrapper that loads Stripe.js and handles payment intent creation
// ABOUTME: Manages the complete checkout flow including form submission and loading states

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import CheckoutForm from './CheckoutForm'
import { logger } from '../lib/logger'
import { getCurrentPricing } from '../lib/sale-config'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function StripeCheckout({ isVisible, onClose }) {
  const [clientSecret, setClientSecret] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [pricing, setPricing] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isVisible) {
      const currentPricing = getCurrentPricing()
      setPricing(currentPricing)
    }
  }, [isVisible])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !name) {
      setError('Please enter both your email and name.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 🎯 Track lead capture - this is a HIGH VALUE event!
      logger.dev('📧 Lead captured:', logger.sanitize({ name, email }));
      
      try {
        const { trackEvent } = await import('../lib/analytics-tracker');
        await trackEvent('lead_capture', {
          name,
          email,
          action: 'email_name_submitted',
          lead_source: 'checkout_form',
          value: pricing?.price || 97 // Potential value
        });
        logger.dev('✅ Lead capture tracked');
      } catch (analyticsError) {
        logger.devWarn('❌ Failed to track lead capture:', analyticsError.message);
      }

      // 🎯 Send lead to GoHighLevel CRM
      try {
        await fetch('/api/ghl-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name, 
            email,
            lead_source: 'checkout_interest',
            status: 'checkout_started' 
          }),
        });
        logger.dev('✅ Lead sent to GoHighLevel');
      } catch (ghlError) {
        logger.devWarn('❌ Failed to send lead to GHL:', ghlError.message);
        // Don't block checkout if GHL fails
      }

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
      
      // 🎯 Track checkout form shown (after lead capture)
      try {
        const { trackEvent } = await import('../lib/analytics-tracker');
        await trackEvent('checkout_form_shown', {
          name,
          email,
          action: 'payment_form_displayed'
        });
        logger.dev('✅ Checkout form display tracked');
      } catch (analyticsError) {
        logger.devWarn('❌ Failed to track checkout form display:', analyticsError.message);
      }
      
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
    layout: {
      type: 'tabs',
      defaultCollapsed: false,
    }
  }

  return (
    <div className="checkout-overlay">
      <div className="checkout-modal">
        <button className="close-btn" onClick={handleClose}>×</button>
        
        <h2>Complete Your Purchase</h2>
        <p className="course-info">The Art of AI Sampling Course - ${pricing?.price || 97}{pricing?.isOnSale ? ` (Save $${pricing.savings}!)` : ''}</p>
        
        <div className="features-list">
          <h3>What's Included:</h3>
          <ul>
            <li><strong>6.5-Hour Course</strong>
              <ul>
                <li>Vision Development - Translating musical ideas into effective AI prompts</li>
                <li>Advanced UDIO Techniques - Moving beyond basic generation</li>
                <li>Stem Separation and Processing - Extracting and refining elements</li>
                <li>Production Integration - Incorporating AI into your workflow</li>
                <li>Sound Design and Repair - Professional enhancement techniques</li>
              </ul>
            </li>
            <li><strong>Lifetime Access to Course Materials</strong></li>
          </ul>
          <h4>You'll also receive:</h4>
          <ul>
            <li>My "UDIO Prompt Engineering Cheat Sheet" PDF</li>
            <li>Access to my Custom Random Tag Generator App</li>
            <li>My Custom Stem Splitting Software</li>
            <li>All Of My Personal Custom Prompt Templates</li>
          </ul>
        </div>
        
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
          padding: 40px;
          border-radius: 16px;
          max-width: 640px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
          text-align: center;
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
        
        .features-list {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          text-align: left;
        }
        
        .features-list h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #333;
        }
        
        .features-list h4 {
          margin: 16px 0 8px 0;
          font-size: 14px;
          color: #333;
        }
        
        .features-list ul {
          margin: 0;
          padding-left: 18px;
        }
        
        .features-list li {
          margin-bottom: 6px;
          font-size: 14px;
          line-height: 1.4;
          color: #555;
        }
        
        .features-list ul ul {
          margin-top: 4px;
          margin-bottom: 8px;
        }
        
        .features-list ul ul li {
          font-size: 13px;
          color: #666;
          margin-bottom: 3px;
        }
      `}</style>
    </div>
  )
}