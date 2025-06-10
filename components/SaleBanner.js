// ABOUTME: Sticky sale banner component for bottom of page
// ABOUTME: Shows sale messaging and countdown timer when sale is active

import { useState, useEffect } from 'react'
import { getCurrentPricing, isSaleActive } from '../lib/sale-config'
import CountdownTimer from './CountdownTimer'

export default function SaleBanner({ onCtaClick }) {
  const [pricing, setPricing] = useState(null)
  const [saleActive, setSaleActive] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const currentPricing = getCurrentPricing()
    setPricing(currentPricing)
    setSaleActive(isSaleActive())
  }, [])

  const handleCountdownExpire = () => {
    const newPricing = getCurrentPricing()
    setPricing(newPricing)
    setSaleActive(isSaleActive())
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  // Don't show banner if no sale is active, or if user closed it
  if (!saleActive || !pricing?.isOnSale || !isVisible) {
    return null
  }

  return (
    <div className="sale-banner">
      <button className="close-btn" onClick={handleClose} aria-label="Close">
        ×
      </button>
      
      <div className="banner-content">
        <div className="banner-left">
          <span className="sale-text">
            Summer Sale: Get the course for ${pricing.price} (was ${pricing.originalPrice})
          </span>
        </div>
        
        <div className="banner-center">
          <CountdownTimer onExpire={handleCountdownExpire} className="countdown-inline" />
        </div>
        
        <div className="banner-actions">
          <button className="cta-btn" onClick={onCtaClick}>
            CLAIM OFFER NOW
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .sale-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #000;
          color: white;
          padding: 12px 20px;
          z-index: 1000;
          border-top: 1px solid #333;
        }
        
        .banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          font-size: 14px;
        }
        
        .banner-left {
          flex: 1;
        }
        
        .banner-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        
        .sale-text {
          color: #ccc;
        }
        
        .banner-actions {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        
        .cta-btn {
          background: #e6ac55;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 25px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: "Poppins", sans-serif;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(230, 172, 85, 0.3);
          background: #d49b44;
        }
        
        .close-btn {
          position: absolute;
          top: 4px;
          right: 8px;
          background: none;
          border: none;
          color: #666;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          z-index: 1;
        }
        
        .close-btn:hover {
          color: #999;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
          .sale-banner {
            padding: 8px 15px;
            padding-right: 35px; /* Extra space for close button */
          }
          
          .banner-content {
            flex-direction: column;
            gap: 6px;
            font-size: 13px;
          }
          
          .banner-left,
          .banner-center,
          .banner-actions {
            flex: none;
            justify-content: center;
          }
          
          .banner-left {
            text-align: center;
          }
          
          .cta-btn {
            font-size: 13px;
            padding: 8px 16px;
          }
          
          .close-btn {
            top: 6px;
            right: 6px;
          }
        }
      `}</style>
    </div>
  )
}