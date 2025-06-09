// ABOUTME: GoHighLevel webhook integration for lead capture
// ABOUTME: Sends interested leads to GHL CRM for follow-up

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, lead_source, status } = req.body

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' })
  }

  try {
    console.log('📧 Sending lead to GoHighLevel:', { name, email, lead_source, status })

    // Check if GHL webhook URL is configured
    const ghlWebhookUrl = process.env.GHL_WEBHOOK_URL
    
    if (!ghlWebhookUrl) {
      console.warn('⚠️ GHL_WEBHOOK_URL not configured, skipping GHL integration')
      return res.status(200).json({ 
        success: true, 
        message: 'Lead captured (GHL webhook not configured)' 
      })
    }

    // Prepare payload for GoHighLevel (optimized format)
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    
    const ghlPayload = {
      firstName: firstName,
      lastName: lastName, 
      email: email,
      phone: '', // We don't collect phone in checkout
      source: 'Website - Art of AI Sampling',
      tags: ['checkout-interest', 'art-of-ai-sampling', 'lead-magnet'],
      customFields: [
        {
          key: 'lead_source',
          value: lead_source || 'checkout_form'
        },
        {
          key: 'lead_status', 
          value: status || 'checkout_started'
        },
        {
          key: 'potential_value',
          value: '98'
        },
        {
          key: 'course_interest',
          value: 'The Art of AI Sampling with TÂCHES'
        },
        {
          key: 'timestamp',
          value: new Date().toISOString()
        }
      ],
      // Additional GHL standard fields
      dateAdded: new Date().toISOString(),
      address1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US'
    }

    // Send to GoHighLevel
    const ghlResponse = await fetch(ghlWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ghlPayload)
    })

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text()
      console.error('❌ GHL webhook failed:', ghlResponse.status, errorText)
      throw new Error(`GHL webhook failed: ${ghlResponse.status}`)
    }

    console.log('✅ Lead successfully sent to GoHighLevel')
    
    res.status(200).json({ 
      success: true, 
      message: 'Lead sent to GoHighLevel successfully' 
    })

  } catch (error) {
    console.error('❌ Error sending lead to GHL:', error)
    
    // Don't fail the request - we don't want to block checkout
    res.status(200).json({ 
      success: false, 
      message: 'Lead captured but GHL sync failed',
      error: error.message 
    })
  }
}