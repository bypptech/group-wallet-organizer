/**
 * E2E Test: Session Authentication Flow
 *
 * Tests the complete session authentication flow:
 * 1. User connects wallet
 * 2. Frontend requests signature for authentication
 * 3. User signs message with wallet
 * 4. Backend creates JWT session
 * 5. Frontend stores token in localStorage
 * 6. Authenticated requests include Bearer token
 * 7. Session validation and refresh
 * 8. Logout and session cleanup
 * 9. Chain switching and session migration
 */

import { test, expect, type Page } from '@playwright/test'

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:3000'

// Helper function to connect wallet
async function connectWallet(page: Page): Promise<string> {
  await page.goto(WEB_BASE_URL)
  await page.click('button:has-text("Connect Wallet")')
  await page.waitForSelector('[data-testid="rk-connect-modal"]')
  await page.click('button:has-text("MetaMask")')

  const metamaskPage = await page.context().waitForEvent('page')
  await metamaskPage.click('button:has-text("Next")')
  await metamaskPage.click('button:has-text("Connect")')

  await page.waitForSelector('[data-testid="rk-account-button"]')
  const accountText = await page.textContent('[data-testid="rk-account-button"]')
  const address = accountText?.match(/(0x[a-fA-F0-9]{40})/)?.[1] || ''

  return address
}

// Helper function to sign message
async function signMessage(page: Page, message: string) {
  const metamaskPage = await page.context().waitForEvent('page')
  await metamaskPage.waitForSelector('text=/Sign message/i')
  await metamaskPage.click('button:has-text("Sign")')
}

// Helper function to get session token from localStorage
async function getSessionToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('session_token'))
}

// Helper function to clear localStorage
async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear())
}

test.describe('Session Authentication E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await clearLocalStorage(page)
  })

  test('should complete full authentication flow', async ({ page }) => {
    // Step 1: Connect wallet
    const userAddress = await connectWallet(page)
    console.log('Connected wallet:', userAddress)

    // Step 2: Verify unauthenticated state
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Not authenticated')

    // Step 3: Click "Sign In" button
    await page.click('button:has-text("Sign In")')

    // Step 4: Verify sign-in message is displayed
    await page.waitForSelector('[data-testid="sign-message-dialog"]')
    const message = await page.textContent('[data-testid="sign-message"]')

    // Verify message contains expected content
    expect(message).toContain('Sign this message to authenticate')
    expect(message).toContain(userAddress)
    expect(message).toContain('Nonce:') // CSRF protection

    // Step 5: Click "Sign Message" button
    await page.click('button:has-text("Sign Message")')

    // Step 6: Sign message in MetaMask
    await signMessage(page, message!)

    // Step 7: Wait for session creation
    await page.waitForSelector('[data-testid="auth-loading"]')
    await page.waitForSelector('[data-testid="auth-success"]', { timeout: 10000 })

    // Step 8: Verify session token is stored in localStorage
    const sessionToken = await getSessionToken(page)
    expect(sessionToken).toBeTruthy()
    expect(sessionToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/) // JWT format

    console.log('Session token:', sessionToken)

    // Step 9: Verify authenticated state
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Authenticated')
    await expect(page.locator('[data-testid="user-address"]')).toContainText(userAddress)

    // Step 10: Verify session details are displayed
    const sessionInfo = page.locator('[data-testid="session-info"]')
    await expect(sessionInfo).toContainText('Session active')
    await expect(sessionInfo).toContainText('Base Sepolia')

    // Step 11: Make authenticated API request
    const response = await page.evaluate(async (token) => {
      const res = await fetch(`${API_BASE_URL}/vaults`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return {
        ok: res.ok,
        status: res.status,
      }
    }, sessionToken)

    expect(response.ok).toBeTruthy()
    expect(response.status).toBe(200)

    console.log('✅ Authentication flow completed successfully')
  })

  test('should handle signature rejection', async ({ page }) => {
    // Step 1: Connect wallet
    await connectWallet(page)

    // Step 2: Click "Sign In"
    await page.click('button:has-text("Sign In")')
    await page.waitForSelector('[data-testid="sign-message-dialog"]')

    // Step 3: Initiate signing
    await page.click('button:has-text("Sign Message")')

    // Step 4: Reject signature in MetaMask
    const metamaskPage = await page.context().waitForEvent('page')
    await metamaskPage.click('button:has-text("Reject")')

    // Step 5: Verify error message is displayed
    await page.waitForSelector('[data-testid="auth-error"]')
    await expect(page.locator('[data-testid="auth-error"]')).toContainText('Signature rejected')

    // Step 6: Verify session token is not created
    const sessionToken = await getSessionToken(page)
    expect(sessionToken).toBeNull()

    // Step 7: Verify still in unauthenticated state
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Not authenticated')

    console.log('✅ Signature rejection handling test completed')
  })

  test('should persist session across page reloads', async ({ page }) => {
    // Step 1: Complete authentication
    await connectWallet(page)
    await page.click('button:has-text("Sign In")')
    await page.click('button:has-text("Sign Message")')
    await signMessage(page, 'Sign this message to authenticate')
    await page.waitForSelector('[data-testid="auth-success"]')

    // Step 2: Get session token
    const sessionToken = await getSessionToken(page)
    expect(sessionToken).toBeTruthy()

    // Step 3: Reload page
    await page.reload()

    // Step 4: Verify session is restored from localStorage
    await page.waitForSelector('[data-testid="auth-status"]')
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Authenticated')

    // Step 5: Verify same session token is used
    const restoredToken = await getSessionToken(page)
    expect(restoredToken).toBe(sessionToken)

    console.log('✅ Session persistence test completed')
  })

  test('should validate session token automatically', async ({ page }) => {
    // Step 1: Complete authentication
    await connectWallet(page)
    await page.click('button:has-text("Sign In")')
    await page.click('button:has-text("Sign Message")')
    await signMessage(page, 'Sign this message to authenticate')
    await page.waitForSelector('[data-testid="auth-success"]')

    // Step 2: Wait for automatic validation (happens every 10 minutes in production)
    // For testing, we'll trigger it manually
    await page.click('[data-testid="validate-session-btn"]')

    // Step 3: Verify validation request is made
    const validationResponse = await page.waitForResponse(
      (response) => response.url().includes('/auth/validate-session') && response.status() === 200
    )

    expect(validationResponse.ok()).toBeTruthy()

    // Step 4: Verify session is still valid
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Authenticated')
    await expect(page.locator('[data-testid="session-valid"]')).toContainText('Valid')

    console.log('✅ Session validation test completed')
  })

  test('should refresh session before expiration', async ({ page }) => {
    // Step 1: Complete authentication
    await connectWallet(page)
    await page.click('button:has-text("Sign In")')
    await page.click('button:has-text("Sign Message")')
    await signMessage(page, 'Sign this message to authenticate')
    await page.waitForSelector('[data-testid="auth-success"]')

    // Step 2: Get initial session token
    const initialToken = await getSessionToken(page)

    // Step 3: Manually trigger session refresh
    await page.click('[data-testid="refresh-session-btn"]')

    // Step 4: Wait for refresh to complete
    await page.waitForSelector('[data-testid="session-refreshed"]')

    // Step 5: Verify new session token is created
    const refreshedToken = await getSessionToken(page)
    expect(refreshedToken).toBeTruthy()
    expect(refreshedToken).not.toBe(initialToken) // New token issued

    // Step 6: Verify session is still authenticated
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Authenticated')

    console.log('✅ Session refresh test completed')
  })

  test('should handle session expiration', async ({ page }) => {
    // Step 1: Create session with short expiration (1 second for testing)
    await connectWallet(page)

    // Use test API endpoint that creates short-lived session
    await page.evaluate(async () => {
      await fetch(`${API_BASE_URL}/auth/create-test-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 1 }), // 1 second
      })
    })

    // Step 2: Verify initial authentication
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Authenticated')

    // Step 3: Wait for session to expire
    await page.waitForTimeout(2000)

    // Step 4: Trigger validation
    await page.click('[data-testid="validate-session-btn"]')

    // Step 5: Verify session is detected as expired
    await page.waitForSelector('[data-testid="session-expired"]')
    await expect(page.locator('[data-testid="session-expired"]')).toContainText('Session expired')

    // Step 6: Verify user is logged out
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Not authenticated')

    // Step 7: Verify token is removed from localStorage
    const sessionToken = await getSessionToken(page)
    expect(sessionToken).toBeNull()

    console.log('✅ Session expiration test completed')
  })

  test('should logout and cleanup session', async ({ page }) => {
    // Step 1: Complete authentication
    const userAddress = await connectWallet(page)
    await page.click('button:has-text("Sign In")')
    await page.click('button:has-text("Sign Message")')
    await signMessage(page, 'Sign this message to authenticate')
    await page.waitForSelector('[data-testid="auth-success"]')

    // Step 2: Verify authenticated state
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Authenticated')

    // Step 3: Click logout button
    await page.click('button:has-text("Logout")')

    // Step 4: Verify logout confirmation dialog
    await page.waitForSelector('[data-testid="logout-confirm-dialog"]')
    await page.click('button:has-text("Confirm Logout")')

    // Step 5: Wait for logout to complete
    await page.waitForSelector('[data-testid="logout-success"]')

    // Step 6: Verify session is cleared from localStorage
    const sessionToken = await getSessionToken(page)
    expect(sessionToken).toBeNull()

    // Step 7: Verify unauthenticated state
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Not authenticated')

    // Step 8: Verify session is deleted from database
    const dbCheckResponse = await page.evaluate(async (address) => {
      const res = await fetch(`${API_BASE_URL}/auth/sessions?userAddress=${address}`)
      const data = await res.json()
      return data.sessions.length
    }, userAddress)

    expect(dbCheckResponse).toBe(0) // No active sessions

    console.log('✅ Logout test completed')
  })

  test('should migrate session when switching chains', async ({ page }) => {
    // Step 1: Authenticate on Base Sepolia
    await connectWallet(page)
    await page.click('button:has-text("Sign In")')
    await page.click('button:has-text("Sign Message")')
    await signMessage(page, 'Sign this message to authenticate')
    await page.waitForSelector('[data-testid="auth-success"]')

    // Step 2: Get initial session token
    const sepoliaToken = await getSessionToken(page)
    console.log('Base Sepolia session token:', sepoliaToken)

    // Step 3: Verify current chain in session info
    await expect(page.locator('[data-testid="session-chain"]')).toContainText('Base Sepolia')

    // Step 4: Switch to Base Mainnet
    await page.click('[data-testid="rk-chain-button"]')
    await page.click('button:has-text("Base")')

    const metamaskPage = await page.context().waitForEvent('page')
    await metamaskPage.click('button:has-text("Switch network")')

    // Step 5: Wait for session migration
    await page.waitForSelector('[data-testid="session-migrating"]')
    await page.waitForSelector('[data-testid="session-migrated"]', { timeout: 10000 })

    // Step 6: Verify new session token is created for Base Mainnet
    const mainnetToken = await getSessionToken(page)
    expect(mainnetToken).toBeTruthy()
    expect(mainnetToken).not.toBe(sepoliaToken) // New token for new chain

    // Step 7: Verify session info shows new chain
    await expect(page.locator('[data-testid="session-chain"]')).toContainText('Base')

    // Step 8: Verify old session is deleted
    const oldSessionCheck = await page.evaluate(async (token) => {
      const res = await fetch(`${API_BASE_URL}/auth/validate-session`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.status
    }, sepoliaToken)

    expect(oldSessionCheck).toBe(401) // Old token is invalid

    console.log('✅ Chain migration test completed')
  })

  test('should prevent CSRF attacks with nonce', async ({ page }) => {
    // Step 1: Connect wallet
    const userAddress = await connectWallet(page)

    // Step 2: Initiate authentication
    await page.click('button:has-text("Sign In")')
    await page.waitForSelector('[data-testid="sign-message"]')

    // Step 3: Capture the nonce from sign message
    const signMessage = await page.textContent('[data-testid="sign-message"]')
    const nonce1 = signMessage?.match(/Nonce: ([a-f0-9-]+)/)?.[1]

    // Step 4: Cancel and retry
    await page.click('button:has-text("Cancel")')
    await page.click('button:has-text("Sign In")')
    await page.waitForSelector('[data-testid="sign-message"]')

    // Step 5: Verify new nonce is generated
    const signMessage2 = await page.textContent('[data-testid="sign-message"]')
    const nonce2 = signMessage2?.match(/Nonce: ([a-f0-9-]+)/)?.[1]

    expect(nonce2).toBeTruthy()
    expect(nonce2).not.toBe(nonce1) // Nonce changes on each request

    // Step 6: Try to replay old signature (simulated CSRF attack)
    const replayResponse = await page.evaluate(
      async ({ address, oldNonce }) => {
        const res = await fetch(`${API_BASE_URL}/auth/create-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: address,
            nonce: oldNonce, // Old nonce (should be rejected)
            signature: '0xfakesignature',
          }),
        })
        return res.status
      },
      { address: userAddress, oldNonce: nonce1 }
    )

    expect(replayResponse).toBe(400) // Bad Request - nonce mismatch

    console.log('✅ CSRF protection test completed')
  })

  test('should display session expiry countdown', async ({ page }) => {
    // Step 1: Complete authentication
    await connectWallet(page)
    await page.click('button:has-text("Sign In")')
    await page.click('button:has-text("Sign Message")')
    await signMessage(page, 'Sign this message to authenticate')
    await page.waitForSelector('[data-testid="auth-success"]')

    // Step 2: Verify expiry countdown is displayed
    await page.waitForSelector('[data-testid="session-expiry"]')
    const expiryText = await page.textContent('[data-testid="session-expiry"]')

    // Verify format like "Expires in: 23h 59m"
    expect(expiryText).toMatch(/Expires in: \d+h \d+m/)

    // Step 3: Wait and verify countdown decrements
    const initialExpiry = expiryText
    await page.waitForTimeout(61000) // Wait 1 minute
    const updatedExpiry = await page.textContent('[data-testid="session-expiry"]')

    expect(updatedExpiry).not.toBe(initialExpiry) // Time decreased

    console.log('✅ Session expiry display test completed')
  })

  test('should handle multiple sessions for same user', async ({ page, context }) => {
    // Step 1: Authenticate in first tab
    const userAddress = await connectWallet(page)
    await page.click('button:has-text("Sign In")')
    await page.click('button:has-text("Sign Message")')
    await signMessage(page, 'Sign this message to authenticate')
    await page.waitForSelector('[data-testid="auth-success"]')

    const token1 = await getSessionToken(page)

    // Step 2: Open second tab and authenticate
    const page2 = await context.newPage()
    await page2.goto(WEB_BASE_URL)

    // Wallet is already connected in context
    await page2.click('button:has-text("Sign In")')
    await page2.click('button:has-text("Sign Message")')
    await signMessage(page2, 'Sign this message to authenticate')
    await page2.waitForSelector('[data-testid="auth-success"]')

    const token2 = await getSessionToken(page2)

    // Step 3: Verify different tokens for different sessions
    expect(token2).toBeTruthy()
    expect(token2).not.toBe(token1)

    // Step 4: Verify both sessions are active in database
    const sessionCount = await page.evaluate(async (address) => {
      const res = await fetch(`${API_BASE_URL}/auth/sessions?userAddress=${address}`)
      const data = await res.json()
      return data.sessions.length
    }, userAddress)

    expect(sessionCount).toBeGreaterThanOrEqual(2)

    // Step 5: Logout from first tab
    await page.click('button:has-text("Logout")')
    await page.click('button:has-text("Confirm Logout")')

    // Step 6: Verify second session is still active
    await expect(page2.locator('[data-testid="auth-status"]')).toContainText('Authenticated')

    await page2.close()

    console.log('✅ Multiple sessions test completed')
  })

  test('should include user agent and IP in session', async ({ page }) => {
    // Step 1: Complete authentication
    await connectWallet(page)
    await page.click('button:has-text("Sign In")')
    await page.click('button:has-text("Sign Message")')
    await signMessage(page, 'Sign this message to authenticate')
    await page.waitForSelector('[data-testid="auth-success"]')

    // Step 2: Open session details
    await page.click('[data-testid="session-info"]')
    await page.waitForSelector('[data-testid="session-details-modal"]')

    // Step 3: Verify user agent is displayed
    const userAgent = await page.textContent('[data-testid="session-user-agent"]')
    expect(userAgent).toContain('Mozilla') // Browser user agent

    // Step 4: Verify IP address is displayed (may be localhost in test)
    const ipAddress = await page.textContent('[data-testid="session-ip"]')
    expect(ipAddress).toMatch(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|::1/) // IPv4 or IPv6 localhost

    // Step 5: Verify last accessed time is shown
    const lastAccessed = await page.textContent('[data-testid="session-last-accessed"]')
    expect(lastAccessed).toContain('seconds ago') // Just accessed

    console.log('✅ Session metadata test completed')
  })
})
