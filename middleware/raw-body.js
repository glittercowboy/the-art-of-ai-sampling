// ABOUTME: Raw body parsing middleware for Stripe webhook signature verification
// ABOUTME: Collects raw request body needed for Stripe webhook validation

export default function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    
    req.on('data', (chunk) => {
      chunks.push(chunk)
    })
    
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks)
      resolve(rawBody)
    })
    
    req.on('error', (error) => {
      reject(error)
    })
  })
}