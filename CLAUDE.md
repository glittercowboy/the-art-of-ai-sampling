# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains "The Art of AI Sampling with TÂCHES" - a Next.js application for a course about using AI tools for music production. The application features integrated Stripe payment processing, Facebook CAPI tracking, and custom analytics.

**Current State**: Fully migrated Next.js application with:
- Embedded Stripe checkout (no redirects)
- Facebook Pixel + CAPI server-side tracking with event deduplication
- GHL webhook integration for course fulfillment
- Custom analytics system with visitor tracking and dashboard

## Architecture Overview

### Frontend Structure
- **Pages** (`/pages/`):
  - `index.js` - Main landing page with course information
  - `stats.js` - Analytics dashboard for tracking conversions
  - `success.js` - Post-payment success page
  
### API Routes (`/pages/api/`)
- **Payment Processing**:
  - `create-payment-intent.js` - Creates Stripe payment intents
  - `stripe-webhook.js` - Handles Stripe webhook events
  
- **Analytics** (`/pages/api/analytics/`):
  - `track.js` - Single event tracking endpoint
  - `batch.js` - Batch event processing for efficiency
  
- **Integration**:
  - `ghl-lead.js` - GHL webhook for course fulfillment
  - `stats.js` - Analytics data API endpoint

### Key Components (`/components/`)
- `StripeCheckout.js` - Embedded payment form
- `FacebookPixel.js` - Client-side pixel tracking
- `CountdownTimer.js` - Enrollment timer
- `EnhancedAnalyticsTracker.js` - Advanced event tracking
- `EnhancedDashboard.js` - Analytics visualization

### Libraries (`/lib/`)
- `stripe.js` - Stripe configuration and utilities
- `facebook-capi.js` - Server-side Facebook tracking
- `analytics.js` - Core analytics functions
- `db.js` - Database connection (Upstash Redis)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run all tests
npm test

# Run tests in watch mode  
npm test:watch

# Run specific test file
npm test -- path/to/test.js

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Testing Strategy

The project follows Test-Driven Development (TDD) with comprehensive test coverage:

- **Test Directories**:
  - `/tests/` - Integration tests for payment flows and webhooks
  - `/__tests__/` - Unit tests for components and utilities
  - `/pages/api/analytics/__tests__/` - API endpoint tests
  - `/lib/__tests__/` - Library function tests

- **Key Test Files**:
  - `payment.test.js` - Payment flow integration tests
  - `webhook.test.js` - Stripe webhook handling tests
  - `analytics.test.js` - Analytics tracking tests
  - `stats.test.js` - Statistics calculation tests

### Stripe Testing

For payment testing during development:
```bash
# Use Stripe CLI to forward webhooks to local development
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Test with Stripe test card numbers
# 4242424242424242 (Visa - Success)
# 4000000000000002 (Card declined)
# 4000000000003220 (3D Secure authentication required)
```

## Environment Variables

Required environment variables for development:
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Facebook
FACEBOOK_PIXEL_ID=your_pixel_id
FACEBOOK_ACCESS_TOKEN=your_access_token

# GHL Integration
GHL_WEBHOOK_URL=https://...

# Database (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## Development Memories

- Don't try to run the server. I will run it with npm run dev myself
- You must ALWAYS test and confirm tests pass before moving on to the next task
- Custom analytics system is used instead of Google Analytics or similar services
- All tracking happens on taches.ai domain to avoid cross-domain attribution issues

## Design Guidelines

When making changes to the website, follow these principles from the `website-design-brief.md`:

- Use clean, minimalist design that prioritizes readability and content hierarchy
- Maintain a flowing, natural reading experience
- Include plenty of white space to let content breathe
- Use the established muted, professional color palette
- Preserve the subtle animated transitions
- Present information in a logical, structured way
- Maintain clear content sections with intuitive navigation

Avoid:
- Aggressive marketing tactics or psychological triggers
- Countdown timers or artificial scarcity indicators
- High-pressure sales language or bold claims
- Pop-ups or intrusive elements
- Bright, attention-grabbing colors
- Unnecessary decorative elements

## Style Guide

### Typography
- Primary headings: "Poppins", sans-serif
- Monospace text: "Cutive Mono", monospace
- Body text: "Inter", sans-serif

### Colors
- Primary accent: #e6ac55
- Text color: #000000
- Background: #f0f0f0
- Subtle background: #f9f9f9
- Card background: #f7f7f7
- Muted text: #666

These values are defined as CSS variables in `styles.css` and should be referenced rather than using hard-coded values.

## Content Tone

Content updates should maintain the established tone:
- Conversational and authentic voice
- Specific, concrete details
- Technical terminology where appropriate
- Professional but approachable tone
- Transparent about limitations and requirements

Avoid:
- Marketing buzzwords
- Exaggerated claims
- High-pressure language
- Artificial urgency
- Unnecessary hype

## Key Architecture Decisions

1. **Single-Domain Tracking**: All operations happen on taches.ai to eliminate cross-domain attribution issues
2. **TDD Approach**: Every feature must have passing tests before implementation
3. **Minimal Complexity**: Use simplest solutions that meet requirements
4. **Production Ready**: Built for Facebook ad campaigns with reliable conversion tracking
5. **Event Deduplication**: Prevent double-counting between client and server-side tracking
6. **No External Analytics**: Custom-built analytics instead of third-party services

## Integration Details

### Payment Processing
- Stripe Elements embedded directly on taches.ai (no redirects)
- Single $98 payment for course access
- Payment intents created server-side for security
- Webhook handling with signature verification

### Facebook Tracking
- Client-side: Facebook Pixel for immediate event firing
- Server-side: Facebook CAPI for improved attribution
- Event deduplication using unique event IDs
- Target: >8.0 Event Match Quality score

### GHL Integration
- Webhook fires on successful payment
- Sends customer data for course fulfillment
- Includes retry logic for reliability
- Direct HTTP POST to GHL inbound webhook URL

### Analytics System
- Custom-built visitor tracking
- Session management with 30-minute timeout
- Real-time stats dashboard at `/stats`
- Tracks page views, unique visitors, engagement time, and conversions

## Deployment

The application is deployed on Vercel with the following configuration:
- Automatic deployments from main branch
- Environment variables configured in Vercel dashboard
- `vercel.json` for custom configuration
- API routes automatically become serverless functions