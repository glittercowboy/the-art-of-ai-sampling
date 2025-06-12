// ABOUTME: API endpoint for creating Stripe payment intents
// ABOUTME: Handles payment initialization with dynamic pricing based on active sales

import stripe from '../../lib/stripe'
import { getCurrentPricing } from '../../lib/sale-config'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, name, attribution } = req.body

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
        }),
        // Add Facebook attribution data to metadata
        ...(attribution?.fbclid && { fb_click_id: attribution.fbclid }),
        ...(attribution?.fbp && { fb_browser_id: attribution.fbp }),
        ...(attribution?.fbc && { fb_click_cookie: attribution.fbc }),
        ...(attribution?.sourceUrl && { source_url: attribution.sourceUrl }),
        ...(attribution?.userAgent && { user_agent: attribution.userAgent })
      }
    })

    // Log attribution data for debugging
    if (attribution && Object.keys(attribution).length > 0) {
      console.log('📊 Facebook attribution data stored in payment intent:', {
        paymentIntentId: paymentIntent.id,
        hasClickId: !!attribution.fbclid,
        hasBrowserId: !!attribution.fbp,
        hasClickCookie: !!attribution.fbc,
        sourceUrl: attribution.sourceUrl
      })
    }

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error('Payment intent creation failed:', error)
    res.status(500).json({ error: 'Payment intent creation failed' })
  }
}