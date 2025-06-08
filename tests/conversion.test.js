/**
 * Test: Verify all existing features work after Next.js conversion
 * This test ensures no functionality regression during migration
 */

import { render, screen, fireEvent } from '@testing-library/react'
import Home from '../pages/index'

// Mock Next.js Head component
jest.mock('next/head', () => {
  return function Head({ children }) {
    return <>{children}</>
  }
})

// Mock StripeCheckout component
jest.mock('../components/StripeCheckout', () => {
  return function StripeCheckout({ isVisible }) {
    return isVisible ? <div>Complete Your Purchase</div> : null
  }
})

// Mock window methods
beforeEach(() => {
  // Mock fbq function
  global.fbq = jest.fn()
  
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = jest.fn()
  
  // Mock window.location
  delete window.location
  window.location = { href: '', search: '' }
  
  // Mock document.cookie
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: '_fbp=test_fbp; _fbc=test_fbc'
  })
})

describe('Next.js Conversion Features', () => {
  test('should render main page content', () => {
    render(<Home />)
    
    // Check key headings are present
    expect(screen.getByText('THE ART OF A.I. SAMPLING')).toBeInTheDocument()
    expect(screen.getByText('IF YOU CAN IMAGINE IT, YOU CAN SAMPLE IT')).toBeInTheDocument()
    expect(screen.getByText('THE ART OF A.I. SAMPLING')).toBeInTheDocument()
  })

  test('should have Facebook pixel integration', () => {
    render(<Home />)
    
    // Check that Facebook pixel initialization would be called
    // Note: We can't test the actual script execution in jsdom
    const scripts = document.querySelectorAll('script')
    const hasPixelScript = Array.from(scripts).some(script => 
      script.innerHTML && script.innerHTML.includes('fbq')
    )
    expect(hasPixelScript).toBe(true)
  })

  test('should render course cards', () => {
    render(<Home />)
    
    expect(screen.getByText('DEFINE')).toBeInTheDocument()
    expect(screen.getByText('GENERATE')).toBeInTheDocument()
    expect(screen.getByText('REFINE')).toBeInTheDocument()
  })

  test('should render pricing section', () => {
    render(<Home />)
    
    expect(screen.getByText('JOIN THE COURSE')).toBeInTheDocument()
    expect(screen.getByText('98')).toBeInTheDocument()
    expect(screen.getByText('30-Day Money-Back Guarantee')).toBeInTheDocument()
  })

  test('should render FAQ section', () => {
    render(<Home />)
    
    expect(screen.getByText('FAQ')).toBeInTheDocument()
    expect(screen.getByText('How is this different from other AI music courses?')).toBeInTheDocument()
    expect(screen.getByText('What exactly will I learn in this course?')).toBeInTheDocument()
  })

  test('should handle Generate Samples button click', () => {
    render(<Home />)
    
    const generateBtn = screen.getByText('GENERATE SAMPLES')
    fireEvent.click(generateBtn)
    
    // Should call Facebook tracking
    expect(global.fbq).toHaveBeenCalledWith('track', 'ViewContent', {
      content_name: 'Course Information'
    })
    
    // Should scroll to howdy section
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  test('should handle course registration button clicks', () => {
    render(<Home />)
    
    const registerBtns = screen.getAllByText(/GET THE COURSE|ENROLL NOW/)
    
    fireEvent.click(registerBtns[0])
    
    // Should call Facebook tracking for checkout initiation
    expect(global.fbq).toHaveBeenCalledWith('track', 'InitiateCheckout', {
      content_name: 'The Art of AI Sampling Course',
      value: 98.00,
      currency: 'USD'
    })
    
    // Should show checkout modal (StripeCheckout component)
    expect(screen.getByText('Complete Your Purchase')).toBeInTheDocument()
  })

  test('should render all required images', () => {
    render(<Home />)
    
    const images = screen.getAllByRole('img')
    const imageSrcs = images.map(img => img.getAttribute('src'))
    
    expect(imageSrcs).toContain('images/tachesteaches.jpg')
    expect(imageSrcs).toContain('images/taches.gif')
    expect(imageSrcs).toContain('images/audi.png')
    expect(imageSrcs).toContain('images/samplefind.png')
  })

  test('should have Read More/Less functionality elements', () => {
    render(<Home />)
    
    expect(screen.getByText('Read More')).toBeInTheDocument()
    expect(screen.getByText('Read Less')).toBeInTheDocument()
    
    // Check for hidden content
    const hiddenContent = document.querySelector('.read-more-content.hidden')
    expect(hiddenContent).toBeInTheDocument()
  })

  test('should maintain existing CSS classes', () => {
    render(<Home />)
    
    // Check for key CSS classes that indicate styling is preserved
    expect(document.querySelector('.header')).toBeInTheDocument()
    expect(document.querySelector('.section')).toBeInTheDocument()
    expect(document.querySelector('.cards-container')).toBeInTheDocument()
    expect(document.querySelector('.pricing-box')).toBeInTheDocument()
    expect(document.querySelector('.faq-content')).toBeInTheDocument()
  })
})