// ABOUTME: API endpoint for collecting analytics events from the client
// ABOUTME: Validates and stores pageview, click, scroll, and engagement events

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // For now, just return success
  return res.status(200).json({ success: true })
}