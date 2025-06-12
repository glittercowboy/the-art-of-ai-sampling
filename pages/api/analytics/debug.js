// ABOUTME: Debug endpoint to check analytics data directly from Redis
// ABOUTME: Provides raw access to analytics counters for troubleshooting

import { getCounter, countUnique, getKeysByPattern } from '../../../lib/analytics-storage'

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
    // Get key engagement metrics directly
    const [
      engagementTotalMs,
      engagementCount,
      pageviewsTotal,
      uniqueVisitors
    ] = await Promise.all([
      getCounter('analytics:engagement:total_ms'),
      getCounter('analytics:engagement:count'),
      getCounter('analytics:pageviews:total'),
      countUnique('analytics:visitors:unique')
    ])

    // Get session engagement keys
    const sessionEngagementKeys = await getKeysByPattern('analytics:session:engagement:*')
    
    // Get individual session engagement times
    const sessionData = []
    for (const key of sessionEngagementKeys.slice(0, 10)) { // Limit to 10 for debug
      const duration = await getCounter(key)
      sessionData.push({
        sessionId: key.replace('analytics:session:engagement:', ''),
        durationMs: duration,
        durationSeconds: Math.round(duration / 1000)
      })
    }

    const averageTimeSeconds = engagementCount > 0 
      ? Math.round((engagementTotalMs / engagementCount) / 1000) 
      : 0

    res.status(200).json({
      engagement: {
        totalMs: engagementTotalMs,
        count: engagementCount,
        averageSeconds: averageTimeSeconds,
        sessionCount: sessionEngagementKeys.length
      },
      metrics: {
        pageviews: pageviewsTotal,
        uniqueVisitors
      },
      recentSessions: sessionData,
      debug: {
        hasEngagementData: engagementTotalMs > 0,
        hasSessionData: sessionEngagementKeys.length > 0
      }
    })
  } catch (error) {
    console.error('Debug API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}