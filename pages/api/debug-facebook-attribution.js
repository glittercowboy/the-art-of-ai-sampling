// ABOUTME: Debug endpoint to test Facebook attribution capture
// ABOUTME: Returns current attribution data without creating a payment

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get user IP from headers
  const userIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                 req.headers['x-real-ip'] || 
                 req.connection?.remoteAddress || 
                 req.socket?.remoteAddress || 
                 'Unknown'

  // Get user agent
  const userAgent = req.headers['user-agent'] || 'Unknown'

  // Parse cookies from request
  const cookies = {}
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        cookies[key] = value
      }
    })
  }

  // Extract Facebook cookies
  const fbp = cookies._fbp || null
  const fbc = cookies._fbc || null

  // Get fbclid from query parameters
  const fbclid = req.query.fbclid || null

  // Get referer
  const referer = req.headers.referer || 'Direct'

  const debugInfo = {
    timestamp: new Date().toISOString(),
    attribution: {
      fbclid,
      fbp,
      fbc,
      userIp,
      userAgent,
      referer
    },
    analysis: {
      hasClickId: !!fbclid,
      hasPixelCookie: !!fbp,
      hasClickCookie: !!fbc,
      hasUserIp: !!userIp && userIp !== 'Unknown',
      hasUserAgent: !!userAgent && userAgent !== 'Unknown',
      expectedMatchQuality: calculateExpectedMatchQuality({ fbclid, fbp, fbc, userIp, userAgent })
    },
    recommendations: getRecommendations({ fbclid, fbp, fbc })
  }

  res.status(200).json(debugInfo)
}

function calculateExpectedMatchQuality({ fbclid, fbp, fbc, userIp, userAgent }) {
  let score = 0
  let factors = []

  // Email (always hashed and sent) - 3 points
  score += 3
  factors.push('Email (hashed)')

  // Browser ID (_fbp) - 2 points
  if (fbp) {
    score += 2
    factors.push('Browser ID (_fbp)')
  }

  // Click ID (_fbc or fbclid) - 2 points
  if (fbc || fbclid) {
    score += 2
    factors.push('Click ID (_fbc/fbclid)')
  }

  // IP Address - 1 point
  if (userIp && userIp !== 'Unknown') {
    score += 1
    factors.push('IP Address')
  }

  // User Agent - 1 point
  if (userAgent && userAgent !== 'Unknown') {
    score += 1
    factors.push('User Agent')
  }

  return {
    score,
    maxScore: 9,
    percentage: Math.round((score / 9) * 100),
    factors
  }
}

function getRecommendations({ fbclid, fbp, fbc }) {
  const recommendations = []

  if (!fbclid && !fbc) {
    recommendations.push({
      issue: 'No Facebook Click ID detected',
      impact: 'Lower attribution accuracy for Facebook ad clicks',
      solution: 'Ensure Facebook ads include click tracking and users arrive directly from ads'
    })
  }

  if (!fbp) {
    recommendations.push({
      issue: 'No Facebook Pixel cookie detected',
      impact: 'Cannot track returning visitors or cross-session attribution',
      solution: 'Verify Facebook Pixel is installed and firing on all pages'
    })
  }

  if (fbclid && !fbc) {
    recommendations.push({
      issue: 'Click ID present but no _fbc cookie',
      impact: 'Facebook may not properly attribute this click',
      solution: 'System will generate _fbc from fbclid, but native cookie is preferred'
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      status: 'Optimal',
      message: 'All Facebook attribution signals detected correctly'
    })
  }

  return recommendations
}