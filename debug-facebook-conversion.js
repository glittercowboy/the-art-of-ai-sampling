// Debug script to verify Facebook conversion tracking setup

import { config } from 'dotenv'
config({ path: '.env.local' })

console.log('=== Facebook Conversion Tracking Debug ===\n')

// 1. Check environment variables
console.log('1. Environment Variables:')
console.log('   FACEBOOK_PIXEL_ID:', process.env.FACEBOOK_PIXEL_ID ? '✅ Set' : '❌ Missing')
console.log('   FACEBOOK_ACCESS_TOKEN:', process.env.FACEBOOK_ACCESS_TOKEN ? '✅ Set (length: ' + process.env.FACEBOOK_ACCESS_TOKEN.length + ')' : '❌ Missing')
console.log('   FACEBOOK_TEST_CODE:', process.env.FACEBOOK_TEST_CODE || 'Not set (production mode)')
console.log('')

// 2. Test Facebook API connectivity
console.log('2. Testing Facebook API Connection:')
const testApiConnection = async () => {
  if (!process.env.FACEBOOK_ACCESS_TOKEN || !process.env.FACEBOOK_PIXEL_ID) {
    console.log('   ❌ Cannot test - missing credentials')
    return
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PIXEL_ID}?fields=id,name&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Connected to Pixel:', data.name || data.id)
    } else {
      const error = await response.json()
      console.log('   ❌ API Error:', error.error?.message || 'Unknown error')
    }
  } catch (error) {
    console.log('   ❌ Connection Error:', error.message)
  }
}

await testApiConnection()
console.log('')

// 3. Check what data is missing for proper attribution
console.log('3. Required Data for Conversion Attribution:')
console.log('   Client-side data needed:')
console.log('   - fbp cookie (Facebook browser ID)')
console.log('   - fbc cookie (Facebook click ID)')
console.log('   - fbclid URL parameter (from ad clicks)')
console.log('   - User IP address')
console.log('   - User agent')
console.log('')

console.log('4. Current Implementation Issues:')
console.log('   ❌ Not passing fbp/fbc cookies to server')
console.log('   ❌ Not capturing user IP address')
console.log('   ❌ Not capturing user agent')
console.log('   ❌ Not passing fbclid to CAPI')
console.log('')

console.log('5. Test Event:')
console.log('   To test conversions safely:')
console.log('   1. Use Facebook Test Events tool')
console.log('   2. Add test_event_code to your .env.local')
console.log('   3. Events will show in Test Events instead of production')
console.log('')

// 4. Send a test event
if (process.env.FACEBOOK_TEST_CODE) {
  console.log('6. Sending Test Purchase Event...')
  
  const { sendPurchaseEvent } = await import('./lib/facebook.js')
  
  try {
    const result = await sendPurchaseEvent({
      email: 'test@example.com',
      paymentId: 'test_' + Date.now(),
      value: 67,
      currency: 'USD'
    })
    
    console.log('   ✅ Test event sent successfully')
    console.log('   Response:', JSON.stringify(result, null, 2))
    console.log('   Check Facebook Events Manager > Test Events')
  } catch (error) {
    console.log('   ❌ Failed to send test event:', error.message)
  }
} else {
  console.log('6. Skipping test event (no FACEBOOK_TEST_CODE set)')
}

console.log('\n=== Recommendations ===')
console.log('1. Add FACEBOOK_TEST_CODE to .env.local for safe testing')
console.log('2. Update payment flow to capture and pass attribution data')
console.log('3. Test with Facebook Pixel Helper Chrome extension')
console.log('4. Use Facebook Test Events to verify conversions')