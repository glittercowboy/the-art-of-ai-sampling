# Analytics Implementation Plan

## Project Specification

**Goal:** Add comprehensive visitor analytics to taches.ai to track user behavior and optimize conversions

**Requirements:**
- Track page views, clicks, scroll depth, and time on page
- Create private stats dashboard with key metrics
- Use Test-Driven Development (TDD) approach
- Zero interference with existing Stripe/Facebook integrations
- Lightweight, privacy-focused implementation
- No external dependencies for tracking

**Success Criteria:**
- All analytics features have comprehensive test coverage
- Existing Stripe payments continue working perfectly
- Facebook tracking remains unaffected
- Stats dashboard provides actionable insights
- Page performance not impacted (<50ms added latency)

## Technology Stack

### Analytics Collection
- **Client-side**: Lightweight custom JavaScript tracker
- **Server-side**: Next.js API routes for event collection
- **Storage**: Vercel KV for real-time metrics
- **Database**: Vercel Postgres for historical data (optional Phase 2)

### Stats Dashboard
- **Framework**: Next.js pages with authentication
- **Charts**: Recharts for data visualization
- **Protection**: Environment variable password
- **Update Frequency**: Real-time counters, 5-minute aggregations

## Implementation Phases

### Phase 1: Core Analytics Infrastructure (Days 1-2)

#### Step 1.1: Set up test infrastructure
- [ ] Create tests/analytics/ directory structure
- [ ] Write failing test for analytics module existence
- [ ] Create minimal analytics module to pass test
- [ ] Write test to verify no interference with existing payment tests
- [ ] Run full test suite to confirm no breakage

#### Step 1.2: Create analytics API endpoint
- [ ] Write failing test for POST /api/analytics/track returning 200
- [ ] Create minimal endpoint returning 200
- [ ] Write failing test for request body validation
- [ ] Add validation logic to pass test
- [ ] Write failing test for invalid requests returning 400
- [ ] Implement error handling to pass test
- [ ] Write failing test for rate limiting (10 req/min)
- [ ] Add rate limiting to pass test

#### Step 1.3: Set up Vercel KV storage
- [ ] Write failing test for KV connection
- [ ] Add KV client initialization
- [ ] Write failing test for incrementing a counter
- [ ] Implement atomic increment operation
- [ ] Write failing test for reading counter value
- [ ] Add read operation to pass test
- [ ] Write failing test for TTL on session data
- [ ] Implement TTL functionality

#### Step 1.4: Build client-side tracker
- [ ] Write failing test for tracker script existence
- [ ] Create empty tracker.js file
- [ ] Write failing test for tracker not blocking page load
- [ ] Implement async loading mechanism
- [ ] Write failing test for tracking function availability
- [ ] Add global tracking function
- [ ] Write test to ensure no console errors in production

### Phase 2: Event Tracking Implementation (Days 2-3)

#### Step 2.1: Page view tracking
- [ ] Write failing test for pageview event firing on load
- [ ] Implement basic pageview tracking
- [ ] Write failing test for unique session ID generation
- [ ] Add sessionStorage-based ID (no cookies)
- [ ] Write failing test for capturing referrer
- [ ] Add referrer to pageview data
- [ ] Write failing test for UTM parameter extraction
- [ ] Implement UTM parsing logic
- [ ] Verify Facebook pixel still fires correctly

#### Step 2.2: Click tracking
- [ ] Write failing test for checkout button click tracking
- [ ] Add click listener to checkout button only
- [ ] Write test to verify Stripe checkout still works
- [ ] Write failing test for tracking click coordinates
- [ ] Add coordinate data to click events
- [ ] Write failing test for preventing duplicate events
- [ ] Implement 500ms debounce on clicks

#### Step 2.3: Scroll depth tracking  
- [ ] Write failing test for 25% scroll detection
- [ ] Implement basic scroll observer
- [ ] Write failing test for throttling (max 1 event/second)
- [ ] Add throttling to scroll handler
- [ ] Write failing test for all depth milestones
- [ ] Track 25%, 50%, 75%, 100% thresholds
- [ ] Write performance test (<10ms per scroll)
- [ ] Optimize if needed

#### Step 2.4: Time on page tracking
- [ ] Write failing test for time tracking start
- [ ] Initialize timer on page load
- [ ] Write failing test for pausing when tab hidden
- [ ] Add Page Visibility API integration
- [ ] Write failing test for sending time on unload
- [ ] Implement beforeunload handler
- [ ] Write test for accuracy (±1 second)
- [ ] Verify and adjust timing logic

### Phase 3: Stats Dashboard (Days 3-4)

#### Step 3.1: Dashboard authentication
- [ ] Write failing test for /stats returning 401 without auth
- [ ] Create basic /stats page returning 401
- [ ] Write failing test for auth with correct password
- [ ] Add password check using env variable
- [ ] Write failing test for auth cookie/session
- [ ] Implement 24-hour session management
- [ ] Test that other pages remain unaffected

#### Step 3.2: Real-time metrics display
- [ ] Write failing test for /api/stats endpoint
- [ ] Create endpoint returning empty data
- [ ] Write failing test for today's visitor count
- [ ] Implement KV query for visitor metrics
- [ ] Write failing test for conversion rate calculation
- [ ] Add purchase data integration (read-only)
- [ ] Write test for data freshness (<1 minute old)
- [ ] Implement caching strategy

#### Step 3.3: Data visualizations
- [ ] Write failing test for stats page rendering
- [ ] Create basic stats page layout
- [ ] Write failing test for visitor count display
- [ ] Add simple metric cards (no charts yet)
- [ ] Write failing test for timeline chart component
- [ ] Integrate Recharts for timeline only
- [ ] Write failing test for mobile responsiveness
- [ ] Add responsive styles

#### Step 3.4: Advanced insights
- [ ] Write failing test for scroll depth summary
- [ ] Calculate and display scroll metrics
- [ ] Write failing test for checkout funnel
- [ ] Show visitors → clickers → buyers funnel
- [ ] Write failing test for average time calculation
- [ ] Implement time aggregation logic
- [ ] Verify all calculations with test data

### Phase 4: Testing & Optimization (Day 5)

#### Step 4.1: Integration testing
- [ ] Write end-to-end test for complete user journey
- [ ] Test: Land → Scroll → Click → Purchase → Stats update
- [ ] Write test for analytics + Stripe concurrent operation
- [ ] Verify both systems work independently
- [ ] Write test for analytics + Facebook pixel
- [ ] Confirm no event duplication or conflicts
- [ ] Write load test for 100 concurrent users
- [ ] Ensure <50ms impact on page load

#### Step 4.2: Data validation  
- [ ] Write test comparing tracked vs actual events
- [ ] Verify 95%+ tracking accuracy
- [ ] Write tests for edge cases:
  - [ ] Page refresh handling
  - [ ] Back button navigation  
  - [ ] Multiple tabs open
  - [ ] Slow network conditions
- [ ] Write test for no PII in stored data
- [ ] Verify GDPR compliance

#### Step 4.3: Documentation
- [ ] Add analytics section to CLAUDE.md
- [ ] Document all API endpoints with examples
- [ ] Create stats dashboard README
- [ ] Write troubleshooting guide for common issues
- [ ] Update package.json with any new scripts
- [ ] Add analytics tests to CI pipeline

## Implementation Details

### Analytics Events Schema

```javascript
{
  event_type: 'pageview' | 'click' | 'scroll' | 'engagement',
  timestamp: Date.now(),
  session_id: 'anonymous-session-id',
  page_url: window.location.href,
  referrer: document.referrer,
  user_agent: navigator.userAgent,
  viewport: { width, height },
  // Event-specific data
  data: {
    // For clicks
    element: 'checkout-button',
    // For scroll
    depth: 75,
    // For engagement
    duration: 45000
  }
}
```

### KV Storage Structure

```javascript
// Real-time counters
analytics:pageviews:today -> 1234
analytics:unique:today -> 567
analytics:clicks:checkout:today -> 89
analytics:conversions:today -> 12

// Aggregated metrics (5-min buckets)
analytics:timeline:2024-01-20:14:30 -> { views: 45, uniques: 23, clicks: 5 }

// User sessions (ephemeral, 30-min TTL)
analytics:session:{id} -> { start: timestamp, pages: 3, duration: 0 }
```

### Dashboard Metrics

1. **Overview Stats**
   - Today's visitors (unique/total)
   - Conversion rate (visitors → purchases)
   - Average time on page
   - Bounce rate

2. **Engagement Metrics**
   - Scroll depth distribution
   - Click-through rate to checkout
   - Session duration histogram
   - Exit points analysis

3. **Traffic Sources**
   - Direct vs referral traffic
   - UTM campaign performance
   - Geographic distribution
   - Device/browser breakdown

4. **Conversion Funnel**
   - Landing → Scroll 50% → Click checkout → Purchase
   - Drop-off rates at each stage
   - Time between stages

## Testing Strategy

### Unit Tests
- Analytics event validation
- Data aggregation functions
- Storage operations
- Chart calculations

### Integration Tests
- End-to-end tracking flow
- API endpoint responses
- Dashboard authentication
- Data persistence

### Performance Tests
- Script loading impact
- API response times
- Concurrent user handling
- Storage operation speed

### Compatibility Tests
- Cross-browser functionality
- Mobile device tracking
- Single-page navigation
- Privacy mode handling

## Privacy & Security

### Data Collection
- No personally identifiable information (PII)
- Anonymous session IDs (no cookies)
- IP addresses not stored
- GDPR-compliant by design

### Access Control
- Dashboard requires authentication
- API endpoints rate-limited
- CORS configured for taches.ai only
- Webhook validation for data integrity

## Risk Mitigation

### Performance Impact
- Async script loading
- Event batching (max 10/request)
- Minimal DOM operations
- CDN delivery for static assets

### Reliability
- Graceful degradation if KV unavailable
- Client-side event queue
- Automatic retry logic
- Error boundary implementation

### Compatibility
- Progressive enhancement approach
- Fallbacks for older browsers
- No blocking of critical features
- Feature detection before use

## Success Metrics

1. **Technical Success**
   - 100% test coverage for analytics code
   - <50ms added page load time
   - Zero Stripe/Facebook integration issues
   - <0.1% error rate in production

2. **Business Success**
   - Identify top conversion barriers
   - Improve checkout click rate by 10%
   - Reduce bounce rate by 15%
   - Data-driven page optimizations

## Next Steps

After implementation:
1. Monitor for 1 week to establish baselines
2. A/B test page optimizations based on data
3. Consider adding heatmaps (Phase 2)
4. Explore predictive analytics (Phase 3)