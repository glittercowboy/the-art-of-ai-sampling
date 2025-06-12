// ABOUTME: API endpoint for tracking and retrieving active visitor count
// ABOUTME: Uses Redis to maintain a real-time count of visitors on the site

import { client, isConnected } from '../../../lib/analytics-storage'
import { logger } from '../../../lib/logger'

const ACTIVE_VISITOR_TTL = 300 // 5 minutes
const ACTIVE_VISITORS_KEY = 'analytics:active_visitors'

export default async function handler(req, res) {
  if (!isConnected) {
    return res.status(200).json({ count: 0, error: 'Storage not connected' })
  }

  try {
    if (req.method === 'POST') {
      // Update visitor activity
      const { sessionId } = req.body
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' })
      }

      // Store session with expiry
      const key = `${ACTIVE_VISITORS_KEY}:${sessionId}`
      await client.setex(key, ACTIVE_VISITOR_TTL, Date.now())
      
      // Get current count
      const count = await getActiveVisitorCount()
      
      return res.status(200).json({ count, updated: true })
      
    } else if (req.method === 'GET') {
      // Get current active visitor count
      const count = await getActiveVisitorCount()
      
      return res.status(200).json({ count })
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    logger.error('Active visitors error:', error)
    return res.status(500).json({ count: 0, error: 'Internal server error' })
  }
}

async function getActiveVisitorCount() {
  try {
    // Get all active visitor keys
    const keys = await client.keys(`${ACTIVE_VISITORS_KEY}:*`)
    
    // Filter out expired keys (Redis should handle this, but just in case)
    const activeKeys = []
    const now = Date.now()
    
    for (const key of keys) {
      const timestamp = await client.get(key)
      if (timestamp && (now - parseInt(timestamp)) < (ACTIVE_VISITOR_TTL * 1000)) {
        activeKeys.push(key)
      }
    }
    
    return activeKeys.length
  } catch (error) {
    logger.error('Error counting active visitors:', error)
    return 0
  }
}