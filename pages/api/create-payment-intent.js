// ABOUTME: API endpoint for creating Stripe payment intents
// ABOUTME: Handles payment initialization for $97 course purchase

import stripe from '../../lib/stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, name } = req.body

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 4700, // $47.00 in cents (Summer Sale - originally $97)
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        email,
        name,
        product: 'The Art of AI Sampling Course',
        sale_type: 'summer_sale',
        original_price: '97.00',
        sale_price: '47.00'
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