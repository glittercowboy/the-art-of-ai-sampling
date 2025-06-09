// ABOUTME: Analytics dashboard API endpoint with authentication
// ABOUTME: Aggregates visitor data from KV storage for protected dashboard access

import { getAnalytics } from '../../lib/analytics'
import { getCounter, getKeysByPattern } from '../../lib/analytics-storage'

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check authentication
  const authHeader = req.headers.authorization
  const password = process.env.ANALYTICS_PASSWORD

  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.replace('Bearer ', '')
  
  if (!password || token !== password) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  try {
    // Get analytics data from storage
    const analyticsData = await getAnalytics()
    
    // Process and aggregate the data
    const stats = await processAnalyticsData(analyticsData)
    
    res.status(200).json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function processAnalyticsData(rawData) {
  const now = new Date()
  const today = now.toISOString().split('T')[0] // YYYY-MM-DD format
  
  try {
    // Get real data from KV storage
    const [
      totalPageviews,
      todayPageviews,
      totalClicks,
      todayClicks,
      totalEngagementMs,
      engagementCount,
      totalLeads,
      todayLeads,
      totalCheckoutForms,
      todayCheckoutForms,
      totalAbandoned,
      todayAbandoned,
      scroll25,
      scroll50,
      scroll75,
      scroll100
    ] = await Promise.all([
      getCounter('analytics:pageviews:total'),
      getCounter(`analytics:pageviews:${today}`),
      getCounter('analytics:clicks:total'),
      getCounter(`analytics:clicks:${today}`),
      getCounter('analytics:engagement:total_ms'),
      getCounter('analytics:engagement:count'),
      getCounter('analytics:leads:total'),
      getCounter(`analytics:leads:${today}`),
      getCounter('analytics:checkout_forms:total'),
      getCounter(`analytics:checkout_forms:${today}`),
      getCounter('analytics:abandoned:total'),
      getCounter(`analytics:abandoned:${today}`),
      getCounter('analytics:scroll:25'),
      getCounter('analytics:scroll:50'),
      getCounter('analytics:scroll:75'),
      getCounter('analytics:scroll:100')
    ])

    // Calculate unique visitors (simplified - count unique sessions)
    const sessionKeys = await getKeysByPattern('analytics:session:*')
    const uniqueVisitors = sessionKeys.length

    // Calculate conversion rates
    const leadConversionRate = totalPageviews > 0 ? (totalLeads / totalPageviews) * 100 : 0
    const checkoutConversionRate = totalLeads > 0 ? (totalCheckoutForms / totalLeads) * 100 : 0
    const abandonmentRate = totalCheckoutForms > 0 ? (totalAbandoned / totalCheckoutForms) * 100 : 0
    
    // Calculate average time on page
    const avgEngagementTime = engagementCount > 0 ? totalEngagementMs / engagementCount : 0

    // Calculate scroll depth distribution
    const totalScrollEvents = scroll25 + scroll50 + scroll75 + scroll100
    const scrollDistribution = [
      { depth: 25, count: scroll25 },
      { depth: 50, count: scroll50 },
      { depth: 75, count: scroll75 },
      { depth: 100, count: scroll100 }
    ]

    // Calculate average scroll depth
    const weightedScrollSum = (scroll25 * 25) + (scroll50 * 50) + (scroll75 * 75) + (scroll100 * 100)
    const avgScrollDepth = totalScrollEvents > 0 ? weightedScrollSum / totalScrollEvents : 0

    // Get timeline data (last 7 days)
    const timeline = await getTimelineData(7)

    const stats = {
      visitors: {
        total: totalPageviews,
        today: todayPageviews,
        unique: uniqueVisitors
      },
      clicks: {
        total: totalClicks,
        today: todayClicks,
        rate: totalPageviews > 0 ? (totalClicks / totalPageviews) * 100 : 0
      },
      leads: {
        total: totalLeads,
        today: todayLeads,
        conversionRate: leadConversionRate
      },
      checkoutForms: {
        total: totalCheckoutForms,
        today: todayCheckoutForms,
        conversionRate: checkoutConversionRate
      },
      abandonment: {
        total: totalAbandoned,
        today: todayAbandoned,
        rate: abandonmentRate
      },
      conversions: {
        total: 0, // This would come from actual purchase data
        rate: 0,
        revenue: 0
      },
      averageTime: Math.round(avgEngagementTime / 1000), // Convert to seconds
      scrollDepth: {
        average: Math.round(avgScrollDepth),
        distribution: scrollDistribution
      },
      timeline,
      lastUpdated: now.toISOString()
    }

    return stats
  } catch (error) {
    console.error('Error processing analytics data:', error)
    // Return empty stats structure on error
    return {
      visitors: { total: 0, today: 0, unique: 0 },
      clicks: { total: 0, today: 0, rate: 0 },
      conversions: { total: 0, rate: 0, revenue: 0 },
      averageTime: 0,
      scrollDepth: { average: 0, distribution: [] },
      timeline: [],
      lastUpdated: now.toISOString()
    }
  }
}

async function getTimelineData(days = 7) {
  const timeline = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const [visitors, clicks] = await Promise.all([
      getCounter(`analytics:pageviews:${dateStr}`),
      getCounter(`analytics:clicks:${dateStr}`)
    ])
    
    timeline.push({
      date: dateStr,
      visitors,
      clicks
    })
  }
  
  return timeline
}