// ABOUTME: Stripe Elements checkout form component for course purchase
// ABOUTME: Handles payment collection and processing with proper error handling

import { useState } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement
} from '@stripe/react-stripe-js'

export default function CheckoutForm({ clientSecret, email, name }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    })

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message)
      } else {
        setMessage("An unexpected error occurred.")
      }
    }

    setIsLoading(false)
  }

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <div className="payment-element-container">
        <PaymentElement 
          id="payment-element" 
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
              radios: false,
              spacedAccordionItems: false
            }
          }}
        />
      </div>
      
      <div className="address-element-container">
        <AddressElement 
          options={{
            mode: 'billing',
          }}
        />
      </div>
      
      <button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className="stripe-submit-btn"
      >
        <span id="button-text">
          {isLoading ? (
            <div className="spinner" id="spinner"></div>
          ) : (
            `Pay $98`
          )}
        </span>
      </button>
      
      {message && <div id="payment-message" className="payment-message">{message}</div>}
      
      <style jsx>{`
        .payment-element-container {
          margin-bottom: 24px;
        }
        
        .address-element-container {
          margin-bottom: 24px;
        }
        
        .stripe-submit-btn {
          background: var(--primary-accent, #e6ac55);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .stripe-submit-btn:hover:not(:disabled) {
          background: #d69a47;
          transform: translateY(-1px);
        }
        
        .stripe-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .payment-message {
          color: #df1b41;
          font-size: 14px;
          margin-top: 12px;
          text-align: center;
        }
      `}</style>
    </form>
  )
}