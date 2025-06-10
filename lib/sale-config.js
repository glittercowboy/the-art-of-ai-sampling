// ABOUTME: Configuration system for managing sales and pricing
// ABOUTME: Handles sale periods, pricing, and dynamic price switching

const SALE_CONFIG = {
  summer2025: {
    name: "Summer Sale",
    // emoji: "🌞",
    startDate: new Date("2025-06-01T00:00:00-07:00"), // PST
    endDate: new Date("2025-06-30T23:59:59-07:00"), // PST
    stripePriceId: "price_1RYWXJGk1M5Eg2svgJntoCRs", // $47 sale price
    salePrice: 47,
    originalPrice: 97,
    savings: 50,
  },
  // Add future sales here - just copy the pattern above with new dates/names
  // Example:
  // blackfriday2025: {
  //   name: "Black Friday",
  //   emoji: "🛍️",
  //   startDate: new Date('2025-11-29T00:00:00-08:00'),
  //   endDate: new Date('2025-12-02T23:59:59-08:00'),
  //   stripePriceId: 'price_1RYWXJGk1M5Eg2svgJntoCRs',
  //   salePrice: 47,
  //   originalPrice: 97,
  //   savings: 50
  // }
};

const REGULAR_PRICING = {
  stripePriceId: "price_1RXnr4Gk1M5Eg2svb9riyGQv", // $97 regular price
  price: 97,
};

/**
 * Get current active sale configuration
 * @returns {Object|null} Active sale config or null if no sale active
 */
export function getActiveSale() {
  const now = new Date();

  for (const [key, sale] of Object.entries(SALE_CONFIG)) {
    if (now >= sale.startDate && now <= sale.endDate) {
      return {
        id: key,
        ...sale,
      };
    }
  }

  return null;
}

/**
 * Get current pricing information
 * @returns {Object} Current pricing config with Stripe price ID
 */
export function getCurrentPricing() {
  const activeSale = getActiveSale();

  if (activeSale) {
    return {
      price: activeSale.salePrice,
      originalPrice: activeSale.originalPrice,
      stripePriceId: activeSale.stripePriceId,
      savings: activeSale.savings,
      isOnSale: true,
      sale: activeSale,
    };
  }

  return {
    price: REGULAR_PRICING.price,
    stripePriceId: REGULAR_PRICING.stripePriceId,
    isOnSale: false,
    sale: null,
  };
}

/**
 * Check if a sale is currently active
 * @returns {boolean}
 */
export function isSaleActive() {
  return getActiveSale() !== null;
}

/**
 * Get time remaining in active sale
 * @returns {Object|null} Time remaining object or null if no active sale
 */
export function getSaleTimeRemaining() {
  const activeSale = getActiveSale();
  if (!activeSale) return null;

  const now = new Date();
  const timeRemaining = activeSale.endDate.getTime() - now.getTime();

  if (timeRemaining <= 0) return null;

  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  return {
    total: timeRemaining,
    days,
    hours,
    minutes,
    seconds,
  };
}
