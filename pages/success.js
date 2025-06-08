// ABOUTME: Payment success page shown after successful Stripe payment
// ABOUTME: Triggers Facebook CAPI Purchase event and shows confirmation message

import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Success() {
  const router = useRouter()
  const [status, setStatus] = useState('loading')
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const paymentIntent = urlParams.get('payment_intent')
      
      if (paymentIntent) {
        // Fire Facebook Purchase event
        if (typeof fbq !== 'undefined') {
          fbq('track', 'Purchase', {
            content_name: 'The Art of AI Sampling Course',
            content_ids: ['TACHES-AI-SAMPLING'],
            value: 98.00,
            currency: 'USD',
            order_id: paymentIntent
          })
        }
        
        setStatus('success')
      } else {
        setStatus('error')
      }
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="success-page">
        <div className="container">
          <h1>Processing...</h1>
          <p>Please wait while we confirm your payment.</p>
        </div>
        <style jsx>{`
          .success-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            font-family: 'Inter', sans-serif;
          }
          .container {
            text-align: center;
            background: white;
            padding: 48px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="success-page">
        <div className="container">
          <h1>Payment Error</h1>
          <p>There was an issue processing your payment. Please contact support.</p>
          <button onClick={() => router.push('/')}>Return to Homepage</button>
        </div>
        <style jsx>{`
          .success-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            font-family: 'Inter', sans-serif;
          }
          .container {
            text-align: center;
            background: white;
            padding: 48px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          button {
            background: #e6ac55;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            margin-top: 16px;
            cursor: pointer;
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Payment Successful - The Art of AI Sampling</title>
        <meta name="robots" content="noindex" />
        
        {/* Facebook Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '924341239600510');
              fbq('track', 'PageView');
            `
          }}
        />
      </Head>
      
      <div className="success-page">
        <div className="container">
          <div className="success-icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Thank you for purchasing The Art of AI Sampling course.</p>
          
          <div className="next-steps">
            <h2>What's Next?</h2>
            <p>You'll receive an email with course access details within the next few minutes.</p>
            <p>If you don't see it, please check your spam folder.</p>
          </div>
          
          <button onClick={() => router.push('/')}>Return to Homepage</button>
        </div>
      </div>
      
      <style jsx>{`
        .success-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f0f0;
          font-family: 'Inter', sans-serif;
          padding: 20px;
        }
        
        .container {
          text-align: center;
          background: white;
          padding: 48px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 100%;
        }
        
        .success-icon {
          font-size: 48px;
          margin-bottom: 24px;
        }
        
        h1 {
          color: #2d5016;
          margin-bottom: 16px;
          font-family: 'Poppins', sans-serif;
        }
        
        .next-steps {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
        }
        
        .next-steps h2 {
          color: #333;
          margin-bottom: 12px;
          font-size: 18px;
        }
        
        .next-steps p {
          color: #666;
          margin-bottom: 8px;
        }
        
        button {
          background: #e6ac55;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        button:hover {
          background: #d69a47;
        }
      `}</style>
    </>
  )
}