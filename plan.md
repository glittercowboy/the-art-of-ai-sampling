# Stripe Integration Project Plan

## Project Specification

**Goal:** Replace GHL checkout with Stripe integration on taches.ai for perfect Facebook ad conversion tracking

**Current State:**
- Static website on taches.ai (likely Vercel)
- Redirects to GHL checkout on taches-teaches.com
- Facebook pixel tracking with cross-domain issues
- Course hosted/managed in GHL

**Target State:**
- Complete checkout flow on taches.ai domain
- Stripe payment processing
- Perfect Facebook CAPI attribution
- Webhook integration to GHL for course access
- Professional checkout UX

**Key Requirements:**
1. Single-domain tracking (taches.ai only)
2. Facebook CAPI server-side events
3. Stripe payment processing
4. GHL webhook integration for course fulfillment
5. One-time payment of $98
6. Capture email and name only
7. Professional checkout UX

**Success Criteria:**
- Facebook Event Manager shows >8.0 match quality
- Seamless course access via existing GHL automation
- Professional checkout experience
- Ready for Facebook ad campaigns

## Technology Stack

### Frontend (Static Site Enhancement)
- **Current**: Vanilla HTML/CSS/JavaScript (keep as-is)
- **Enhancement**: Add Stripe Elements for embedded checkout
- **Tracking**: Enhanced Facebook Pixel + server-side CAPI

### Backend (New Serverless Functions)
- **Platform**: Vercel Serverless Functions (Node.js runtime)
- **Framework**: Next.js API routes (minimal, just for API endpoints)
- **Language**: JavaScript/Node.js

### Payment Processing
- **Provider**: Stripe Checkout (embedded, not redirect)
- **Implementation**: Server-side payment intent creation
- **Security**: Webhook signature verification with raw body parsing

### Tracking & Analytics
- **Facebook CAPI**: Official Facebook Business SDK for Node.js
- **Implementation**: Server-side events with event deduplication
- **Matching**: fbp, fbc, email hashing for >8.0 match quality

### CRM Integration
- **Method**: Direct webhook to GHL inbound webhook URL
- **Backup**: Retry logic with exponential backoff
- **Data**: Email, name, purchase status for course access automation

## Architecture Decisions

### 1. Vercel + Next.js API Routes
**Decision**: Use Next.js API routes instead of plain Vercel functions
**Rationale**: 
- Better webhook body parsing for Stripe signature verification
- Built-in environment variable handling
- Easier testing and development
- Future-proof for potential frontend enhancements

### 2. Stripe Elements Embedded (Not Checkout Sessions)
**Decision**: Use Stripe Elements on taches.ai, not redirected Checkout
**Rationale**:
- Maintains single-domain tracking
- Better UX control and branding
- Perfect Facebook attribution
- Professional appearance

### 3. Facebook CAPI Server-Side Only
**Decision**: Send CAPI events from server, deduplicate with browser pixel
**Rationale**:
- iOS 14.5+ compliance
- Higher event match quality
- Reliable conversion tracking for ads
- Event deduplication prevents double-counting

### 4. Direct GHL Webhook Integration
**Decision**: Direct HTTP POST to GHL webhook URL
**Rationale**:
- Simplest implementation
- No third-party dependencies (Zapier/Make)
- Lower latency
- Full control over retry logic

## Project Structure
```
/
├── index.html (existing - enhanced)
├── styles.css (existing - enhanced)  
├── script.js (existing - enhanced)
├── package.json (new)
├── next.config.js (new)
├── /api
│   ├── create-payment-intent.js (new)
│   ├── stripe-webhook.js (new)
│   └── facebook-capi.js (new)
├── /lib
│   ├── stripe.js (new)
│   ├── facebook.js (new)
│   └── ghl.js (new)
└── /tests
    ├── payment.test.js (new)
    ├── webhook.test.js (new)
    └── integration.test.js (new)
```

## Environment Variables Required
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FACEBOOK_PIXEL_ID=924341239600510
FACEBOOK_ACCESS_TOKEN=...
GHL_WEBHOOK_URL=https://...
```

## Implementation Phases

### Phase 1: Foundation Setup
**Goal**: Convert static site to Next.js with basic infrastructure
**Deliverable**: Working Next.js app with existing functionality intact

### Phase 2: Stripe Integration
**Goal**: Implement payment processing with embedded checkout
**Deliverable**: Functional payment flow with test transactions

### Phase 3: Webhook & GHL Integration
**Goal**: Handle successful payments and integrate with GHL
**Deliverable**: Automated course access via GHL webhook

### Phase 4: Facebook CAPI Integration
**Goal**: Implement server-side conversion tracking
**Deliverable**: Perfect Facebook attribution with >8.0 match quality

### Phase 5: Testing & Polish
**Goal**: Comprehensive testing and production deployment
**Deliverable**: Production-ready system with monitoring

## Detailed Implementation Steps (TDD Approach)

### Phase 1: Foundation Setup

**1.1 Initialize Next.js Project**
- Create package.json with minimal dependencies
- Set up next.config.js for static export compatibility
- Write test: Verify Next.js app starts and serves existing pages
- Test passes: Existing site functionality preserved

**1.2 Convert Static Files**
- Move index.html content to pages/index.js
- Migrate CSS and JavaScript
- Write test: All existing features work (FAQ, animations, etc.)
- Test passes: No functionality regression

**1.3 Set Up Development Environment**
- Configure environment variables
- Set up Vercel deployment
- Write test: Deployment pipeline works
- Test passes: Site deploys successfully

### Phase 2: Stripe Integration

**2.1 Create Payment Intent API**
- Write test: API creates valid Stripe PaymentIntent
- Implement /api/create-payment-intent.js
- Test passes: Returns client_secret for $98 payment

**2.2 Add Checkout Form**
- Write test: Form collects email and name
- Add Stripe Elements to checkout section
- Test passes: Form validates and submits

**2.3 Handle Payment Confirmation**
- Write test: Successful payment shows confirmation
- Implement client-side payment handling
- Test passes: Test payment completes successfully

### Phase 3: Webhook & GHL Integration

**3.1 Stripe Webhook Handler**
- Write test: Webhook verifies Stripe signature
- Implement /api/stripe-webhook.js
- Test passes: Webhook processes payment events securely

**3.2 GHL Integration**
- Write test: GHL webhook receives correct data format
- Implement GHL API call in webhook handler
- Test passes: Course access granted automatically

**3.3 Error Handling & Retries**
- Write test: Failed GHL calls retry with backoff
- Implement retry logic
- Test passes: System handles GHL downtime gracefully

### Phase 4: Facebook CAPI Integration

**4.1 CAPI Event Sending**
- Write test: Purchase events sent to Facebook with correct parameters
- Implement Facebook CAPI in webhook handler
- Test passes: Events appear in Facebook Events Manager

**4.2 Event Deduplication**
- Write test: Browser and server events don't double-count
- Implement event_id matching
- Test passes: Facebook shows single conversion per purchase

**4.3 Attribution Optimization**
- Write test: Event match quality score >8.0
- Implement customer data hashing and fbp/fbc capture
- Test passes: High-quality attribution data

### Phase 5: Testing & Polish

**5.1 Integration Testing**
- Write test: Complete purchase flow end-to-end
- Test all error scenarios and edge cases
- Test passes: System handles all failure modes

**5.2 Production Configuration**
- Write test: Production environment variables work
- Set up live Stripe keys and webhooks
- Test passes: Live payments process correctly

**5.3 Performance & Monitoring**
- Write test: Page load times under 2 seconds
- Optimize assets and implement logging
- Test passes: Fast loading and proper error visibility

## Core Implementation Flow

1. **Enhanced Landing Page**
   - Add checkout form with Stripe Elements
   - Integrate Facebook Pixel with enhanced tracking
   - Remove GHL redirect buttons

2. **Payment Processing**
   - `/api/create-payment-intent` - Creates Stripe PaymentIntent
   - Client-side Stripe Elements handles card collection
   - Server-side payment confirmation

3. **Webhook Handler**
   - `/api/stripe-webhook` - Processes successful payments
   - Triggers Facebook CAPI Purchase event
   - Sends data to GHL webhook for course access

4. **Tracking Integration**
   - Server-side Facebook CAPI events
   - Event deduplication with browser pixel
   - Perfect attribution chain

## Testing Strategy
- Unit tests for each API function
- Integration tests with Stripe test mode
- Manual end-to-end testing
- Facebook Test Events verification

## Success Metrics
- Facebook Event Match Quality >8.0
- Payment success rate >99%
- GHL course access automation 100% reliable
- Page load time <2 seconds
- Zero cross-domain tracking issues

## Risk Mitigation
- Webhook delivery failures: Retry logic with exponential backoff
- Payment processing errors: Comprehensive error handling and user feedback
- Facebook CAPI issues: Event deduplication and fallback to pixel-only
- GHL integration failures: Manual course access as backup