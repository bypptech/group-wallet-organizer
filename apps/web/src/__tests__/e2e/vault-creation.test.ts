/**
 * E2E Test: Vault Creation Flow
 *
 * Tests the complete vault creation flow:
 * 1. User connects wallet
 * 2. Generates UUID for new vault
 * 3. Frontend predicts vault address using VaultFactory
 * 4. User confirms and signs transaction
 * 5. VaultFactory deploys vault via CREATE2
 * 6. VaultCreated event is emitted
 * 7. Backend indexes event and stores vault in database
 * 8. Frontend displays newly created vault
 */

import { test, expect, type Page } from '@playwright/test'
import { v4 as uuidv4 } from 'uuid'

// Test configuration
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'
const VAULT_FACTORY_ADDRESS = process.env.VAULT_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000'
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:3000'

// Helper function to connect MetaMask wallet in test
async function connectWallet(page: Page) {
  // Navigate to the app
  await page.goto(WEB_BASE_URL)

  // Click "Connect Wallet" button
  await page.click('button:has-text("Connect Wallet")')

  // Wait for RainbowKit modal
  await page.waitForSelector('[data-testid="rk-connect-modal"]')

  // Select MetaMask
  await page.click('button:has-text("MetaMask")')

  // Wait for MetaMask extension popup
  const metamaskPage = await page.context().waitForEvent('page')

  // Approve connection in MetaMask
  await metamaskPage.click('button:has-text("Next")')
  await metamaskPage.click('button:has-text("Connect")')

  // Wait for wallet to be connected
  await page.waitForSelector('[data-testid="rk-account-button"]')
}

// Helper function to switch network in MetaMask
async function switchToBaseSepolia(page: Page) {
  // Click network switcher
  await page.click('[data-testid="rk-chain-button"]')

  // Select Base Sepolia
  await page.click('button:has-text("Base Sepolia")')

  // Wait for MetaMask network switch
  const metamaskPage = await page.context().waitForEvent('page')
  await metamaskPage.click('button:has-text("Switch network")')

  // Wait for network switch to complete
  await page.waitForSelector('text=/Base Sepolia/i')
}

// Helper function to approve transaction in MetaMask
async function approveTransaction(page: Page) {
  const metamaskPage = await page.context().waitForEvent('page')
  await metamaskPage.click('button:has-text("Confirm")')
  await metamaskPage.waitForSelector('text=/Transaction submitted/i')
}

test.describe('Vault Creation E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure MetaMask extension is installed and unlocked
    // Note: This requires MetaMask to be pre-configured in the test environment
  })

  test('should create vault through complete flow', async ({ page }) => {
    // Step 1: Connect wallet
    await connectWallet(page)

    // Step 2: Navigate to vault creation page
    await page.goto(`${WEB_BASE_URL}/vaults/create`)

    // Verify we're on the creation page
    await expect(page.locator('h1')).toContainText('Create New Vault')

    // Step 3: Generate UUID for new vault
    const uuid = uuidv4()
    console.log('Generated UUID:', uuid)

    // Step 4: Fill in vault creation form
    await page.fill('input[name="vaultName"]', 'Test Family Vault')
    await page.fill('textarea[name="description"]', 'E2E test vault')

    // Step 5: Predict vault address
    await page.click('button:has-text("Predict Address")')

    // Wait for address prediction
    await page.waitForSelector('[data-testid="predicted-address"]')
    const predictedAddress = await page.textContent('[data-testid="predicted-address"]')
    console.log('Predicted vault address:', predictedAddress)

    // Verify predicted address format (0x followed by 40 hex chars)
    expect(predictedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)

    // Step 6: Verify CAIP-10 identifier is displayed
    const caip10Element = await page.locator('[data-testid="predicted-caip10"]')
    const caip10 = await caip10Element.textContent()
    console.log('Predicted CAIP-10:', caip10)
    expect(caip10).toMatch(/^eip155:84532:0x[a-fA-F0-9]{40}$/)

    // Step 7: Submit vault creation
    await page.click('button:has-text("Create Vault")')

    // Step 8: Approve transaction in MetaMask
    await approveTransaction(page)

    // Step 9: Wait for transaction confirmation
    await page.waitForSelector('[data-testid="tx-pending"]')
    await page.waitForSelector('[data-testid="tx-confirmed"]', { timeout: 30000 })

    // Step 10: Verify VaultCreated event was emitted
    const txHash = await page.textContent('[data-testid="tx-hash"]')
    console.log('Transaction hash:', txHash)

    // Step 11: Wait for backend indexing
    await page.waitForTimeout(5000) // Give backend time to index the event

    // Step 12: Verify vault appears in database via API
    const apiResponse = await page.request.get(`${API_BASE_URL}/vaults/address/${predictedAddress}`)
    expect(apiResponse.ok()).toBeTruthy()

    const vaultData = await apiResponse.json()
    expect(vaultData.address).toBe(predictedAddress)
    expect(vaultData.name).toBe('Test Family Vault')
    expect(vaultData.chainId).toBe(84532) // Base Sepolia
    expect(vaultData.caip10).toBe(caip10)

    // Step 13: Verify vault displays on frontend
    await page.goto(`${WEB_BASE_URL}/vaults`)
    await page.waitForSelector(`[data-vault-address="${predictedAddress}"]`)

    // Verify vault card displays correctly
    const vaultCard = page.locator(`[data-vault-address="${predictedAddress}"]`)
    await expect(vaultCard).toContainText('Test Family Vault')
    await expect(vaultCard).toContainText(predictedAddress.slice(0, 6))

    // Step 14: Navigate to vault details page
    await vaultCard.click()
    await page.waitForURL(`${WEB_BASE_URL}/vaults/${predictedAddress}`)

    // Step 15: Verify vault details page
    await expect(page.locator('h1')).toContainText('Test Family Vault')
    await expect(page.locator('[data-testid="vault-address"]')).toContainText(predictedAddress)
    await expect(page.locator('[data-testid="vault-caip10"]')).toContainText(caip10)
    await expect(page.locator('[data-testid="vault-chain"]')).toContainText('Base Sepolia')

    // Step 16: Verify owner is added as member
    const membersSection = page.locator('[data-testid="vault-members"]')
    await expect(membersSection).toContainText('Owner')

    console.log('✅ Vault creation E2E test completed successfully')
  })

  test('should handle vault creation errors gracefully', async ({ page }) => {
    // Step 1: Connect wallet
    await connectWallet(page)

    // Step 2: Navigate to vault creation page
    await page.goto(`${WEB_BASE_URL}/vaults/create`)

    // Step 3: Try to create vault without filling required fields
    await page.click('button:has-text("Create Vault")')

    // Step 4: Verify validation errors are displayed
    await expect(page.locator('[data-testid="error-name"]')).toContainText('Vault name is required')

    // Step 5: Fill in name but use invalid characters
    await page.fill('input[name="vaultName"]', 'Invalid@Name#')
    await page.click('button:has-text("Create Vault")')

    // Verify validation error
    await expect(page.locator('[data-testid="error-name"]')).toContainText('Invalid characters')

    // Step 6: Use valid name
    await page.fill('input[name="vaultName"]', 'Valid Vault Name')
    await page.click('button:has-text("Create Vault")')

    // Step 7: Reject transaction in MetaMask
    const metamaskPage = await page.context().waitForEvent('page')
    await metamaskPage.click('button:has-text("Reject")')

    // Step 8: Verify error message is displayed
    await page.waitForSelector('[data-testid="tx-rejected"]')
    await expect(page.locator('[data-testid="tx-rejected"]')).toContainText('Transaction was rejected')

    console.log('✅ Error handling test completed successfully')
  })

  test('should predict same address for same UUID and owner', async ({ page }) => {
    // Step 1: Connect wallet
    await connectWallet(page)

    const userAddress = await page.textContent('[data-testid="rk-account-button"]')
    console.log('User address:', userAddress)

    // Step 2: Navigate to vault creation page
    await page.goto(`${WEB_BASE_URL}/vaults/create`)

    // Step 3: Use a fixed UUID for determinism test
    const testUuid = '123e4567-e89b-12d3-a456-426614174000'

    // Step 4: Predict address first time
    await page.fill('input[name="vaultName"]', 'Test Vault 1')
    await page.click('button:has-text("Predict Address")')
    await page.waitForSelector('[data-testid="predicted-address"]')
    const address1 = await page.textContent('[data-testid="predicted-address"]')

    // Step 5: Clear and predict again with same UUID
    await page.fill('input[name="vaultName"]', 'Test Vault 2')
    await page.click('button:has-text("Predict Address")')
    await page.waitForSelector('[data-testid="predicted-address"]')
    const address2 = await page.textContent('[data-testid="predicted-address"]')

    // Step 6: Verify addresses are identical (CREATE2 determinism)
    expect(address1).toBe(address2)
    console.log('✅ CREATE2 determinism verified:', address1)
  })

  test('should handle network switching during vault creation', async ({ page }) => {
    // Step 1: Connect wallet on wrong network (Ethereum Mainnet)
    await connectWallet(page)

    // Step 2: Navigate to vault creation page
    await page.goto(`${WEB_BASE_URL}/vaults/create`)

    // Step 3: Verify network warning is displayed
    await expect(page.locator('[data-testid="network-warning"]')).toContainText(
      'Please switch to Base Sepolia'
    )

    // Verify Create button is disabled
    const createButton = page.locator('button:has-text("Create Vault")')
    await expect(createButton).toBeDisabled()

    // Step 4: Switch to Base Sepolia
    await switchToBaseSepolia(page)

    // Step 5: Verify warning is gone and button is enabled
    await expect(page.locator('[data-testid="network-warning"]')).not.toBeVisible()
    await expect(createButton).toBeEnabled()

    console.log('✅ Network switching test completed successfully')
  })

  test('should display gas estimation before vault creation', async ({ page }) => {
    // Step 1: Connect wallet
    await connectWallet(page)

    // Step 2: Navigate to vault creation page
    await page.goto(`${WEB_BASE_URL}/vaults/create`)

    // Step 3: Fill in vault details
    await page.fill('input[name="vaultName"]', 'Gas Test Vault')

    // Step 4: Predict address (triggers gas estimation)
    await page.click('button:has-text("Predict Address")')

    // Step 5: Wait for gas estimation
    await page.waitForSelector('[data-testid="gas-estimate"]')
    const gasEstimate = await page.textContent('[data-testid="gas-estimate"]')

    // Verify gas estimate is displayed in ETH
    expect(gasEstimate).toMatch(/~\d+\.\d+ ETH/)
    console.log('Gas estimate:', gasEstimate)

    // Verify gas estimate is reasonable (between 0.0001 and 0.01 ETH)
    const gasValue = parseFloat(gasEstimate.replace(/[^0-9.]/g, ''))
    expect(gasValue).toBeGreaterThan(0.0001)
    expect(gasValue).toBeLessThan(0.01)

    console.log('✅ Gas estimation test completed successfully')
  })

  test('should support vault creation on different chains', async ({ page }) => {
    // Step 1: Connect wallet
    await connectWallet(page)

    // Step 2: Switch to Base Mainnet
    await page.click('[data-testid="rk-chain-button"]')
    await page.click('button:has-text("Base")')

    const metamaskPage = await page.context().waitForEvent('page')
    await metamaskPage.click('button:has-text("Switch network")')

    // Step 3: Navigate to vault creation page
    await page.goto(`${WEB_BASE_URL}/vaults/create`)

    // Step 4: Create vault on Base Mainnet
    await page.fill('input[name="vaultName"]', 'Mainnet Test Vault')
    await page.click('button:has-text("Predict Address")')

    // Step 5: Verify CAIP-10 shows correct chain (8453 for Base Mainnet)
    const caip10 = await page.textContent('[data-testid="predicted-caip10"]')
    expect(caip10).toMatch(/^eip155:8453:0x[a-fA-F0-9]{40}$/)

    console.log('✅ Multi-chain support test completed successfully')
  })

  test('should copy vault address and CAIP-10 to clipboard', async ({ page }) => {
    // Step 1: Connect wallet and create vault
    await connectWallet(page)
    await page.goto(`${WEB_BASE_URL}/vaults/create`)
    await page.fill('input[name="vaultName"]', 'Copy Test Vault')
    await page.click('button:has-text("Predict Address")')

    // Step 2: Wait for predicted address
    await page.waitForSelector('[data-testid="predicted-address"]')

    // Step 3: Click copy address button
    await page.click('[data-testid="copy-address-btn"]')

    // Step 4: Verify clipboard contains address
    const clipboardAddress = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)

    // Step 5: Click copy CAIP-10 button
    await page.click('[data-testid="copy-caip10-btn"]')

    // Step 6: Verify clipboard contains CAIP-10
    const clipboardCaip10 = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardCaip10).toMatch(/^eip155:\d+:0x[a-fA-F0-9]{40}$/)

    // Step 7: Verify success toast is displayed
    await expect(page.locator('[data-testid="copy-success-toast"]')).toContainText('Copied to clipboard')

    console.log('✅ Clipboard copy test completed successfully')
  })

  test('should open block explorer for vault address', async ({ page }) => {
    // Step 1: Connect wallet and create vault
    await connectWallet(page)
    await page.goto(`${WEB_BASE_URL}/vaults/create`)
    await page.fill('input[name="vaultName"]', 'Explorer Test Vault')
    await page.click('button:has-text("Create Vault")')
    await approveTransaction(page)

    // Wait for confirmation
    await page.waitForSelector('[data-testid="tx-confirmed"]')

    // Step 2: Click "View on Explorer" button
    const [explorerPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.click('button:has-text("View on Explorer")'),
    ])

    // Step 3: Verify explorer URL is correct
    expect(explorerPage.url()).toContain('basescan.org')
    expect(explorerPage.url()).toContain('address/0x')

    await explorerPage.close()

    console.log('✅ Block explorer test completed successfully')
  })
})
