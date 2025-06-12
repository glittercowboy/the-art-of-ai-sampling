# Facebook Attribution Implementation

## Overview

This document describes the Facebook conversion tracking implementation that captures and passes attribution data from Facebook ads through the entire purchase flow to Facebook's Conversions API (CAPI).

## Implementation Details

### 1. Client-Side Attribution Capture

**File:** `/lib/facebook-attribution.js`

The system captures the following attribution data on the client side:
- **fbclid**: Facebook Click ID from URL parameters (when user clicks a Facebook ad)
- **_fbp**: Facebook Pixel browser ID cookie (identifies the browser)
- **_fbc**: Facebook Click cookie (links the click to the user)
- **userAgent**: Browser user agent string
- **sourceUrl**: The full URL including any parameters

Key features:
- Automatically creates `_fbc` cookie from `fbclid` if not present
- Stores attribution data in sessionStorage for persistence across page navigation
- Handles missing data gracefully

### 2. Attribution Flow

1. **Page Load** (`/pages/_app.js`)
   - Captures attribution data on initial page load
   - Stores in sessionStorage if Facebook data is present

2. **Checkout Initiation** (`/components/StripeCheckout.js`)
   - Retrieves stored attribution data
   - Captures fresh data and merges with stored data
   - Sends attribution data with payment intent creation

3. **Payment Intent Creation** (`/pages/api/create-payment-intent.js`)
   - Receives attribution data from client
   - Stores in Stripe payment intent metadata:
     - `fb_click_id`: fbclid parameter
     - `fb_browser_id`: _fbp cookie
     - `fb_click_cookie`: _fbc cookie
     - `source_url`: Original landing page
     - `user_agent`: Browser user agent

4. **Webhook Processing** (`/pages/api/stripe-webhook.js`)
   - Extracts attribution from payment intent metadata
   - Captures server-side data:
     - User IP address from headers
     - User agent (prefers client-side version if available)
   - Passes complete attribution to Facebook CAPI

5. **Facebook CAPI** (`/lib/facebook.js`)
   - Sends Purchase event with full attribution:
     - Hashed email address
     - Facebook browser ID (_fbp)
     - Facebook click ID (_fbc)
     - Client IP address
     - Client user agent
     - Event source URL

## Testing & Debugging

### Debug Endpoint

**URL:** `/api/debug-facebook-attribution`

Returns current attribution data and analysis:
```json
{
  "timestamp": "2024-01-20T12:00:00Z",
  "attribution": {
    "fbclid": "IwAR2KtV_vPBQz123456789",
    "fbp": "fb.1.1699999999999.1234567890",
    "fbc": "fb.1.1699999999999.IwAR2KtV_vPBQz123456789",
    "userIp": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "referer": "https://facebook.com"
  },
  "analysis": {
    "hasClickId": true,
    "hasPixelCookie": true,
    "hasClickCookie": true,
    "hasUserIp": true,
    "hasUserAgent": true,
    "expectedMatchQuality": {
      "score": 9,
      "maxScore": 9,
      "percentage": 100,
      "factors": ["Email (hashed)", "Browser ID (_fbp)", "Click ID (_fbc/fbclid)", "IP Address", "User Agent"]
    }
  },
  "recommendations": [
    {
      "status": "Optimal",
      "message": "All Facebook attribution signals detected correctly"
    }
  ]
}
```

### Unit Tests

**File:** `/lib/__tests__/facebook-attribution.test.js`

Comprehensive test suite covering:
- Cookie parsing
- fbclid capture
- Session storage persistence
- Data merging logic
- Error handling

## Expected Improvements

This implementation should significantly improve Facebook Event Match Quality (EMQ) score by:

1. **Capturing all available identifiers**: fbclid, _fbp, _fbc cookies
2. **Including additional matching data**: IP address, user agent
3. **Preserving attribution across pages**: Using sessionStorage
4. **Proper server-side attribution**: Passing data through payment flow

Target EMQ score: >8.0 (from current ~6.0)

## Security Considerations

- Email addresses are SHA-256 hashed before sending to Facebook
- No sensitive payment information is included in attribution
- All data transmission uses HTTPS
- Attribution data is only used for conversion tracking

## Monitoring

The implementation includes comprehensive logging:
- Client-side: Attribution capture events
- Server-side: Payment intent creation with attribution
- Webhook: Attribution extraction and CAPI submission
- Facebook CAPI: Success/failure with trace IDs

Check logs for:
- `🎯 Facebook attribution captured`
- `📊 Facebook attribution data stored`
- `🔍 Processing purchase with attribution`
- `📤 Sending Facebook CAPI event`
- `✅ Facebook CAPI event sent successfully`