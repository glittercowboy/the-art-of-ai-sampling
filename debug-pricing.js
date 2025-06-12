// Debug script to check current pricing configuration

import { getCurrentPricing, getActiveSale, isSaleActive } from './lib/sale-config.js'

console.log('=== Pricing Debug ===')
console.log('Current Date:', new Date().toString())
console.log('Current Date (ISO):', new Date().toISOString())
console.log('')

const activeSale = getActiveSale()
console.log('Active Sale:', activeSale)
console.log('Is Sale Active:', isSaleActive())
console.log('')

const pricing = getCurrentPricing()
console.log('Current Pricing:', pricing)
console.log('')

console.log('Expected behavior:')
console.log('- Price should be: $67')
console.log('- Stripe Price ID should be: price_1RYWXJGk1M5Eg2svgJntoCRs')
console.log('')

console.log('Actual values:')
console.log('- Price is:', `$${pricing.price}`)
console.log('- Stripe Price ID is:', pricing.stripePriceId)