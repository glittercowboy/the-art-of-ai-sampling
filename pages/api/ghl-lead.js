// ABOUTME: GoHighLevel webhook integration for lead capture
// ABOUTME: Sends interested leads to GHL CRM for follow-up

import { logger } from '../../lib/logger'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, lead_source, status } = req.body

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' })
  }

  try {
    logger.dev('📧 Sending lead to GoHighLevel:', logger.sanitize({ name, email, lead_source, status }))

    // Check if GHL webhook URL is configured
    const ghlWebhookUrl = process.env.GHL_WEBHOOK_URL
    
    if (!ghlWebhookUrl) {
      logger.devWarn('⚠️ GHL_WEBHOOK_URL not configured, skipping GHL integration')
      return res.status(200).json({ 
        success: true, 
        message: 'Lead captured (GHL webhook not configured)' 
      })
    }

    logger.dev('🎯 GHL Webhook URL configured')

    // Prepare basic payload for GoHighLevel 
    // (Keep it simple - only send standard contact fields)
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    
    const ghlPayload = {
      firstName: firstName,
      lastName: lastName, 
      email: email,
      phone: '', 
      source: 'Website Checkout Interest'
    }

    logger.dev('📤 Sending payload to GHL:', logger.sanitize(ghlPayload))

    // Send to GoHighLevel
    const ghlResponse = await fetch(ghlWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ghlPayload)
    })

    logger.dev('📨 GHL Response Status:', ghlResponse.status)

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text()
      logger.error('❌ GHL webhook failed:', ghlResponse.status)
      logger.dev('❌ Failed payload was:', logger.sanitize(ghlPayload))
      throw new Error(`GHL webhook failed: ${ghlResponse.status}`)
    }

    const responseText = await ghlResponse.text()
    logger.dev('✅ GHL Response Body:', responseText)
    logger.info('✅ Lead successfully sent to GoHighLevel')
    
    res.status(200).json({ 
      success: true, 
      message: 'Lead sent to GoHighLevel successfully' 
    })

  } catch (error) {
    logger.error('❌ Error sending lead to GHL:', error.message)
    
    // Don't fail the request - we don't want to block checkout
    res.status(200).json({ 
      success: false, 
      message: 'Lead captured but GHL sync failed',
      error: error.message 
    })
  }
}