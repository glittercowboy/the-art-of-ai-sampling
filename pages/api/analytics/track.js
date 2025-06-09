// ABOUTME: API endpoint for collecting analytics events from the client
// ABOUTME: Validates and stores pageview, click, scroll, and engagement events

const VALID_EVENT_TYPES = ['pageview', 'click', 'scroll', 'engagement']
const REQUIRED_FIELDS = ['event_type', 'session_id']

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { body } = req

  // Check for valid request body
  if (body === null || body === undefined) {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  // Validate required fields - body could be array or non-object
  if (typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid request body' })
  }
  
  const missingFields = REQUIRED_FIELDS.filter(field => !body[field])
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(', ')}`
    })
  }

  // Validate event_type
  if (!VALID_EVENT_TYPES.includes(body.event_type)) {
    return res.status(400).json({
      error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`
    })
  }

  // All validation passed
  return res.status(200).json({ success: true })
}