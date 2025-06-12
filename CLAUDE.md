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

# Run development server
npm run dev

# Run tests
npm test

# Run specific test file
npm test -- payment.test.js

# Build for production
npm run build

# Run production build locally
npm start
```

### Stripe Integration Testing

For payment testing during development:
```bash
# Use Stripe CLI to forward webhooks to local development
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Test with Stripe test card numbers
# 4242424242424242 (Visa)
# 4000000000000002 (Card declined)
```

## Development Memories

- Don't try to run the server. I will run it with npm run dev myself
- You must ALWAYS test and confirm tests pass before moving on to the next task.

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

## Project Implementation Context

This repository is transitioning from a static site to a Next.js application with integrated payments. See `plan.md` for the complete implementation roadmap.

### Key Integration Requirements

**Payment Processing**: 
- Stripe Elements embedded on taches.ai domain (not redirected)
- Single $98 payment for course access
- Professional checkout UX replacing current GHL redirect

**Tracking & Analytics**:
- Facebook Pixel (browser-side) + Facebook CAPI (server-side)
- Event deduplication to prevent double-counting
- Target: >8.0 Event Match Quality score for ad optimization

**CRM Integration**:
- Webhook to GHL for automated course access
- Direct HTTP POST to GHL inbound webhook URL
- Retry logic for webhook reliability

### Critical Architecture Decisions

1. **Single-Domain Tracking**: Everything happens on taches.ai to eliminate cross-domain attribution issues
2. **TDD Approach**: Every feature must have passing tests before implementation
3. **Minimal Complexity**: Use simplest solutions that meet requirements
4. **Production Ready**: Built for Facebook ad campaigns with reliable conversion tracking

When working on this project, always reference `plan.md` for detailed implementation steps and maintain the established design aesthetic while adding new functionality.