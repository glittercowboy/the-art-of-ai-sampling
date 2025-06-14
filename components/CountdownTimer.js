// ABOUTME: Countdown timer component for sale end times
// ABOUTME: Updates in real-time and triggers callbacks when timer expires

import { useState, useEffect } from 'react'
import { getSaleTimeRemaining } from '../lib/sale-config'

export default function CountdownTimer({ onExpire, className }) {
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const remaining = getSaleTimeRemaining()
      
      if (!remaining) {
        if (!isExpired) {
          setIsExpired(true)
          if (onExpire) onExpire()
        }
        setTimeRemaining(null)
        return
      }
      
      setTimeRemaining(remaining)
      setIsExpired(false)
    }

    // Update immediately
    updateTimer()
    
    // Update every second
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [isExpired, onExpire])

  if (!timeRemaining || isExpired) {
    return null
  }

  const formatTime = (time) => time.toString().padStart(2, '0')

  return (
    <div className={`countdown-timer ${className || ''}`}>
      <div className="countdown-label">Sale ends in:</div>
      <div className="countdown-display">
        {timeRemaining.days > 0 && (
          <div className="countdown-unit">
            <div className="countdown-number">{timeRemaining.days}</div>
            <div className="countdown-text">day{timeRemaining.days !== 1 ? 's' : ''}</div>
          </div>
        )}
        <div className="countdown-unit">
          <div className="countdown-number">{formatTime(timeRemaining.hours)}</div>
          <div className="countdown-text">hrs</div>
        </div>
        <div className="countdown-unit">
          <div className="countdown-number">{formatTime(timeRemaining.minutes)}</div>
          <div className="countdown-text">min</div>
        </div>
        <div className="countdown-unit">
          <div className="countdown-number">{formatTime(timeRemaining.seconds)}</div>
          <div className="countdown-text">sec</div>
        </div>
      </div>
      
      <style jsx>{`
        .countdown-timer {
          text-align: center;
          margin: 1rem 0;
        }
        
        .countdown-label {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .countdown-display {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .countdown-unit {
          text-align: center;
          min-width: 45px;
        }
        
        .countdown-number {
          font-size: 1.8rem;
          font-weight: 700;
          color: #ff6b6b;
          line-height: 1;
          font-family: 'Poppins', sans-serif;
        }
        
        .countdown-text {
          font-size: 0.75rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }
        
        .countdown-separator {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ff6b6b;
          margin: 0 0.2rem;
        }
        
        @media (max-width: 480px) {
          .countdown-number {
            font-size: 1.5rem;
          }
          
          .countdown-text {
            font-size: 0.7rem;
          }
          
          .countdown-separator {
            font-size: 1.2rem;
          }
          
          .countdown-unit {
            min-width: 35px;
          }
        }
        
        /* Compact styles for banner */
        .countdown-timer.countdown-compact {
          margin: 0;
        }
        
        .countdown-compact .countdown-label {
          font-size: 0.8rem;
          margin-bottom: 2px;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .countdown-compact .countdown-number {
          font-size: 1.3rem;
          color: white;
        }
        
        .countdown-compact .countdown-text {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .countdown-compact .countdown-separator {
          color: white;
          font-size: 1.1rem;
        }
        
        @media (max-width: 768px) {
          .countdown-compact .countdown-number {
            font-size: 1.1rem;
          }
          
          .countdown-compact .countdown-separator {
            font-size: 1rem;
          }
        }
        
        /* Inline styles for banner */
        .countdown-timer.countdown-inline {
          margin: 0;
        }
        
        .countdown-inline .countdown-label {
          display: none;
        }
        
        .countdown-inline .countdown-display {
          gap: 4px;
        }
        
        .countdown-inline .countdown-number {
          font-size: 14px;
          color: white;
          font-weight: 600;
        }
        
        .countdown-inline .countdown-text {
          font-size: 11px;
          color: #999;
        }
        
        .countdown-inline .countdown-separator {
          color: #666;
          font-size: 12px;
          margin: 0 1px;
        }
        
        .countdown-inline .countdown-unit {
          min-width: auto;
        }
        
        @media (max-width: 768px) {
          .countdown-inline .countdown-number {
            font-size: 13px;
          }
          
          .countdown-inline .countdown-text {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  )
}