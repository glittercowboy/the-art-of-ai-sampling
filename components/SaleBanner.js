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
      <button className="close-btn" onClick={handleClose} aria-label="Close banner">
        ×
      </button>
      
      <div className="banner-content">
        <div className="banner-left">
          <div className="sale-info">
            <span className="sale-badge-small">{pricing.sale.emoji} {pricing.sale.name}</span>
            <div className="price-info">
              <span className="original-price-small">${pricing.originalPrice}</span>
              <span className="sale-price-large">${pricing.price}</span>
              <span className="savings-small">Save ${pricing.savings}!</span>
            </div>
          </div>
        </div>
        
        <div className="banner-center">
          <CountdownTimer onExpire={handleCountdownExpire} className="countdown-compact" />
        </div>
        
        <div className="banner-right">
          <button className="cta-btn" onClick={onCtaClick}>
            Get Course Now
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .sale-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #ff6b6b, #ffd93d);
          color: white;
          padding: 12px 20px;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .close-btn {
          position: absolute;
          top: 8px;
          right: 15px;
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          opacity: 0.8;
          line-height: 1;
        }
        
        .close-btn:hover {
          opacity: 1;
        }
        
        .banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          gap: 20px;
        }
        
        .banner-left {
          flex: 1;
          min-width: 200px;
        }
        
        .sale-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .sale-badge-small {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .price-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .original-price-small {
          text-decoration: line-through;
          opacity: 0.8;
          font-size: 1rem;
        }
        
        .sale-price-large {
          font-size: 1.5rem;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
        }
        
        .savings-small {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .banner-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        
        .banner-right {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          min-width: 150px;
        }
        
        .cta-btn {
          background: white;
          color: #ff6b6b;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
          .sale-banner {
            padding: 10px 15px;
          }
          
          .banner-content {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
          
          .banner-left,
          .banner-center,
          .banner-right {
            flex: none;
          }
          
          .price-info {
            justify-content: center;
          }
          
          .sale-price-large {
            font-size: 1.3rem;
          }
          
          .cta-btn {
            padding: 10px 20px;
            font-size: 0.9rem;
          }
          
          .close-btn {
            top: 5px;
            right: 10px;
            font-size: 18px;
          }
        }
        
        @media (max-width: 480px) {
          .banner-content {
            gap: 6px;
          }
          
          .sale-info {
            gap: 2px;
          }
          
          .price-info {
            gap: 6px;
          }
          
          .sale-price-large {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  )
}