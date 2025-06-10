// ABOUTME: API endpoint for creating Stripe payment intents
// ABOUTME: Handles payment initialization with dynamic pricing based on active sales

import stripe from '../../lib/stripe'
import { getCurrentPricing } from '../../lib/sale-config'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, name } = req.body

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' })
  }

  try {
    // Get current pricing (dynamic based on active sales)
    const pricing = getCurrentPricing()
    
    // Create payment intent with current pricing
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.price * 100, // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        email,
        name,
        product: 'The Art of AI Sampling Course',
        price_paid: pricing.price.toString(),
        stripe_price_id: pricing.stripePriceId,
        is_on_sale: pricing.isOnSale.toString(),
        ...(pricing.isOnSale && {
          sale_type: pricing.sale.id,
          original_price: pricing.originalPrice.toString(),
          savings: pricing.savings.toString()
        })
      }
    })

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error('Payment intent creation failed:', error)
    res.status(500).json({ error: 'Payment intent creation failed' })
  }
}