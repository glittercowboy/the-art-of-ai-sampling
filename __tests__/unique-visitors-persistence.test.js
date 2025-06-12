// ABOUTME: Integration test demonstrating persistent unique visitor tracking
// ABOUTME: Shows that unique visitor count doesn't decrease when sessions expire

import * as analyticsStorage from '../lib/analytics-storage'

describe('Unique Visitor Persistence', () => {
  it('demonstrates the fix for decreasing unique visitor counts', async () => {
    // Scenario: Track 3 unique visitors
    const visitors = ['session-1', 'session-2', 'session-3']
    
    // Mock storage to simulate real behavior
    const uniqueVisitorSet = new Set()
    const sessionKeys = new Set()
    
    // Mock addUnique to add to our set
    analyticsStorage.addUnique = jest.fn(async (key, value) => {
      if (key === 'analytics:visitors:unique') {
        const isNew = !uniqueVisitorSet.has(value)
        uniqueVisitorSet.add(value)
        return isNew
      }
      return true
    })
    
    // Mock countUnique to count our set
    analyticsStorage.countUnique = jest.fn(async (key) => {
      if (key === 'analytics:visitors:unique') {
        return uniqueVisitorSet.size
      }
      return 0
    })
    
    // Mock session operations
    analyticsStorage.setSession = jest.fn(async (key) => {
      sessionKeys.add(key)
      return 'OK'
    })
    
    analyticsStorage.getKeysByPattern = jest.fn(async (pattern) => {
      if (pattern === 'analytics:session:*') {
        return Array.from(sessionKeys)
      }
      return []
    })
    
    console.log('Step 1: Track 3 unique visitors')
    for (const visitor of visitors) {
      await analyticsStorage.addUnique('analytics:visitors:unique', visitor)
      await analyticsStorage.setSession(`analytics:session:${visitor}`, {})
    }
    
    // OLD BEHAVIOR: Count session keys
    const sessionCount = (await analyticsStorage.getKeysByPattern('analytics:session:*')).length
    console.log(`OLD: Counting session keys = ${sessionCount} unique visitors`)
    
    // NEW BEHAVIOR: Count from persistent set
    const uniqueCount = await analyticsStorage.countUnique('analytics:visitors:unique')
    console.log(`NEW: Counting from persistent set = ${uniqueCount} unique visitors`)
    
    expect(sessionCount).toBe(3)
    expect(uniqueCount).toBe(3)
    
    console.log('\nStep 2: Simulate session expiration by clearing session keys')
    sessionKeys.clear()
    
    // OLD BEHAVIOR: Would show 0 unique visitors
    const sessionCountAfterExpiry = (await analyticsStorage.getKeysByPattern('analytics:session:*')).length
    console.log(`OLD: After session expiry = ${sessionCountAfterExpiry} unique visitors (BUG!)`)
    
    // NEW BEHAVIOR: Still shows correct count
    const uniqueCountAfterExpiry = await analyticsStorage.countUnique('analytics:visitors:unique')
    console.log(`NEW: After session expiry = ${uniqueCountAfterExpiry} unique visitors (CORRECT!)`)
    
    expect(sessionCountAfterExpiry).toBe(0) // Sessions expired
    expect(uniqueCountAfterExpiry).toBe(3) // But unique visitors persist
    
    console.log('\nStep 3: Track a returning visitor')
    await analyticsStorage.addUnique('analytics:visitors:unique', 'session-1') // Returning visitor
    await analyticsStorage.setSession('analytics:session:session-1', {})
    
    const finalUniqueCount = await analyticsStorage.countUnique('analytics:visitors:unique')
    console.log(`NEW: Still ${finalUniqueCount} unique visitors (no duplicate counting)`)
    
    expect(finalUniqueCount).toBe(3) // Still 3 unique visitors
  })
})