# Production Deployment Guide

This guide walks you through deploying your Stripe integration to production.

## 1. Stripe Setup

### Create Product in Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Fill in:
   - **Name**: "The Art of AI Sampling Course"
   - **Description**: "Complete course on AI music sampling techniques"
   - **Pricing**: One-time payment, $98.00 USD
   - **Payment type**: One-time
4. Save the product
5. **Copy the Price ID** (starts with `price_`) - you'll need this

### Get Stripe Keys
1. Go to [Developers > API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)

## 2. Deploy to Vercel

### Option A: Deploy from GitHub
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Set environment variables (see section 3)
5. Deploy

### Option B: Deploy with Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 3. Environment Variables

Set these in Vercel Dashboard > Project > Settings > Environment Variables:

### Required Variables
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=(get from webhook setup below)
FACEBOOK_PIXEL_ID=924341239600510
FACEBOOK_ACCESS_TOKEN=(get from Facebook setup)
GHL_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/mGMWF3JpgTd8KeGbjWFM/webhook-trigger/7b5bb466-cd56-48f5-b099-7de5fd74e58a
```

### Test Mode (for initial testing)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=(test webhook secret)
```

## 4. Configure Stripe Webhooks

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-app.vercel.app/api/stripe-webhook`
4. Select events to send:
   - `payment_intent.succeeded`
5. Click "Add endpoint"
6. **Copy the webhook secret** (starts with `whsec_`)
7. Add this to your environment variables as `STRIPE_WEBHOOK_SECRET`

## 5. Facebook Conversions API Setup

### Get Facebook Access Token
1. Go to [Facebook Business Manager](https://business.facebook.com)
2. Go to Events Manager > Data Sources > Your Pixel
3. Settings > Conversions API
4. Generate access token
5. Copy the token and add to environment variables

### Verify Pixel ID
- Your pixel ID: `924341239600510`
- Verify this is correct in your Facebook Events Manager

## 6. Test the Integration

### Test Stripe Payment (Test Mode)
1. Use test card: `4242424242424242`
2. Any future expiry date
3. Any 3-digit CVC
4. Complete the payment
5. Check Stripe Dashboard > Payments for successful payment

### Test Webhooks
1. Go to Stripe Dashboard > Webhooks > Your endpoint
2. Click "Send test webhook"
3. Select `payment_intent.succeeded`
4. Check your app logs to see if webhook was processed

### Test Facebook Events
1. Go to Facebook Events Manager > Test Events
2. Enter your test event code (if using)
3. Make a test purchase
4. Verify Purchase event appears in Facebook

## 7. Go Live Checklist

- [ ] Stripe keys switched to live mode
- [ ] Webhook endpoint using live webhook secret
- [ ] Facebook access token is production token
- [ ] Test real payment with real card
- [ ] Verify Facebook Purchase event tracked
- [ ] Verify GHL course access granted
- [ ] Test complete customer journey

## 8. Monitoring

### Stripe Dashboard
- Monitor payments in real-time
- Check webhook delivery status
- Review failed payments

### Facebook Events Manager
- Monitor conversion events
- Check Event Match Quality score (target >8.0)
- Review attribution data

### Application Logs
- Monitor Vercel function logs
- Check for webhook processing errors
- Monitor retry attempts

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is correct
   - Verify webhook secret matches
   - Check Vercel function logs

2. **Facebook events not showing**
   - Verify access token is valid
   - Check pixel ID is correct
   - Review event deduplication

3. **GHL course access not granted**
   - Check webhook URL is correct
   - Verify GHL automation is active
   - Review webhook payload format

### Support Contacts
- Stripe: [Stripe Support](https://support.stripe.com)
- Facebook: [Facebook Business Support](https://www.facebook.com/business/help)
- Vercel: [Vercel Support](https://vercel.com/support)