// ABOUTME: Stripe configuration and utilities for server-side operations
// ABOUTME: Initializes Stripe instance with secret key for payment processing

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export default stripe