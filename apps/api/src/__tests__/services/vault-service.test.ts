/**
 * VaultService Integration Tests
 *
 * Tests for VaultService with database operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { VaultService } from '../../services/vault-service'
import { getDatabase } from '../../db/client'
import type { Address, UUID } from '@/packages/shared'

describe('VaultService Integration Tests', () => {
  let vaultService: VaultService
  let testVaultId: string
  const testOwner: Address = '0x1234567890123456789012345678901234567890'
  const testAddress: Address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const testUuid: UUID = '123e4567-e89b-12d3-a456-426614174000'
  const testChainId = 84532 // Base Sepolia

  beforeAll(async () => {
    // Initialize service
    vaultService = new VaultService()
  })

  beforeEach(async () => {
    // Clean up test data before each test
    const db = await getDatabase()
    // Note: In production, use proper test database isolation
  })

  describe('createVault', () => {
    it('should create a vault with valid parameters', async () => {
      const vault = await vaultService.createVault({
        address: testAddress,
        chainId: testChainId,
        uuid: testUuid,
        name: 'Test Vault',
        description: 'A test vault',
        owner: testOwner,
      })

      expect(vault).toBeDefined()
      expect(vault.address).toBe(testAddress)
      expect(vault.chainId).toBe(testChainId)
      expect(vault.uuid).toBe(testUuid)
      expect(vault.name).toBe('Test Vault')
      expect(vault.caip10).toBe(`eip155:${testChainId}:${testAddress}`)

      testVaultId = vault.id
    })

    it('should create CAIP-10 identifier automatically', async () => {
      const vault = await vaultService.createVault({
        address: '0x1111111111111111111111111111111111111111' as Address,
        chainId: testChainId,
        uuid: '123e4567-e89b-12d3-a456-426614174001' as UUID,
        name: 'CAIP-10 Test',
        owner: testOwner,
      })

      expect(vault.caip10).toMatch(/^eip155:\d+:0x[a-fA-F0-9]{40}$/)
      expect(vault.caip10).toContain(vault.address)
      expect(vault.caip10).toContain(vault.chainId.toString())
    })

    it('should add owner as member', async () => {
      const vault = await vaultService.createVault({
        address: '0x2222222222222222222222222222222222222222' as Address,
        chainId: testChainId,
        uuid: '123e4567-e89b-12d3-a456-426614174002' as UUID,
        name: 'Member Test',
        owner: testOwner,
      })

      const members = await vaultService.getMembers(vault.id)
      expect(members).toHaveLength(1)
      expect(members[0].address).toBe(testOwner)
      expect(members[0].role).toBe('owner')
    })

    it('should accept optional salt and factoryAddress', async () => {
      const testSalt = '0x1234567890123456789012345678901234567890123456789012345678901234'
      const testFactory: Address = '0x3333333333333333333333333333333333333333'

      const vault = await vaultService.createVault({
        address: '0x4444444444444444444444444444444444444444' as Address,
        chainId: testChainId,
        uuid: '123e4567-e89b-12d3-a456-426614174003' as UUID,
        name: 'Factory Test',
        salt: testSalt,
        factoryAddress: testFactory,
        owner: testOwner,
      })

      expect(vault.salt).toBe(testSalt)
      expect(vault.factoryAddress).toBe(testFactory)
    })
  })

  describe('getVaultByAddress', () => {
    beforeEach(async () => {
      // Create test vault
      await vaultService.createVault({
        address: testAddress,
        chainId: testChainId,
        uuid: testUuid,
        name: 'Lookup Test',
        owner: testOwner,
      })
    })

    it('should retrieve vault by address', async () => {
      const vault = await vaultService.getVaultByAddress(testAddress)
      expect(vault).toBeDefined()
      expect(vault?.address).toBe(testAddress)
    })

    it('should retrieve vault by address and chainId', async () => {
      const vault = await vaultService.getVaultByAddress(testAddress, testChainId)
      expect(vault).toBeDefined()
      expect(vault?.chainId).toBe(testChainId)
    })

    it('should return null for non-existent address', async () => {
      const vault = await vaultService.getVaultByAddress(
        '0x9999999999999999999999999999999999999999' as Address
      )
      expect(vault).toBeNull()
    })
  })

  describe('getVaultByUUID', () => {
    beforeEach(async () => {
      await vaultService.createVault({
        address: testAddress,
        chainId: testChainId,
        uuid: testUuid,
        name: 'UUID Test',
        owner: testOwner,
      })
    })

    it('should retrieve vault by UUID', async () => {
      const vault = await vaultService.getVaultByUUID(testUuid)
      expect(vault).toBeDefined()
      expect(vault?.uuid).toBe(testUuid)
    })

    it('should return null for non-existent UUID', async () => {
      const vault = await vaultService.getVaultByUUID(
        '999e4567-e89b-12d3-a456-426614174999' as UUID
      )
      expect(vault).toBeNull()
    })
  })

  describe('getVaultByCAIP10', () => {
    beforeEach(async () => {
      await vaultService.createVault({
        address: testAddress,
        chainId: testChainId,
        uuid: testUuid,
        name: 'CAIP-10 Lookup',
        owner: testOwner,
      })
    })

    it('should retrieve vault by CAIP-10 identifier', async () => {
      const caip10 = `eip155:${testChainId}:${testAddress}`
      const vault = await vaultService.getVaultByCAIP10(caip10 as any)
      expect(vault).toBeDefined()
      expect(vault?.caip10).toBe(caip10)
    })

    it('should return null for non-existent CAIP-10', async () => {
      const vault = await vaultService.getVaultByCAIP10(
        'eip155:1:0x9999999999999999999999999999999999999999' as any
      )
      expect(vault).toBeNull()
    })
  })

  describe('getVaultsByUser', () => {
    beforeEach(async () => {
      // Create multiple vaults for the same user
      await vaultService.createVault({
        address: '0x1111111111111111111111111111111111111111' as Address,
        chainId: testChainId,
        uuid: '123e4567-e89b-12d3-a456-426614174010' as UUID,
        name: 'User Vault 1',
        owner: testOwner,
      })

      await vaultService.createVault({
        address: '0x2222222222222222222222222222222222222222' as Address,
        chainId: testChainId,
        uuid: '123e4567-e89b-12d3-a456-426614174011' as UUID,
        name: 'User Vault 2',
        owner: testOwner,
      })
    })

    it('should retrieve all vaults for a user', async () => {
      const vaults = await vaultService.getVaultsByUser(testOwner)
      expect(vaults.length).toBeGreaterThanOrEqual(2)
    })

    it('should filter by chainId', async () => {
      const vaults = await vaultService.getVaultsByUser(testOwner, testChainId)
      expect(vaults.length).toBeGreaterThanOrEqual(2)
      vaults.forEach((vault) => {
        expect(vault.chainId).toBe(testChainId)
      })
    })
  })

  describe('Member Management', () => {
    let vaultId: string

    beforeEach(async () => {
      const vault = await vaultService.createVault({
        address: testAddress,
        chainId: testChainId,
        uuid: testUuid,
        name: 'Member Management Test',
        owner: testOwner,
      })
      vaultId = vault.id
    })

    it('should add a member', async () => {
      const newMember: Address = '0x5555555555555555555555555555555555555555'
      await vaultService.addMember({
        vaultId,
        address: newMember,
        role: 'guardian',
        weight: 5,
        addedBy: testOwner,
      })

      const members = await vaultService.getMembers(vaultId)
      const addedMember = members.find((m) => m.address === newMember)
      expect(addedMember).toBeDefined()
      expect(addedMember?.role).toBe('guardian')
      expect(addedMember?.weight).toBe(5)
    })

    it('should check membership', async () => {
      const isMember = await vaultService.isMember(vaultId, testOwner)
      expect(isMember).toBe(true)

      const isNotMember = await vaultService.isMember(
        vaultId,
        '0x9999999999999999999999999999999999999999' as Address
      )
      expect(isNotMember).toBe(false)
    })

    it('should get member role', async () => {
      const role = await vaultService.getMemberRole(vaultId, testOwner)
      expect(role).toBe('owner')
    })

    it('should remove a member', async () => {
      const memberToRemove: Address = '0x6666666666666666666666666666666666666666'
      await vaultService.addMember({
        vaultId,
        address: memberToRemove,
        role: 'viewer',
        addedBy: testOwner,
      })

      await vaultService.removeMember(vaultId, memberToRemove, testOwner)

      const isMember = await vaultService.isMember(vaultId, memberToRemove)
      expect(isMember).toBe(false)
    })
  })

  describe('createVaultIdentifier', () => {
    it('should create valid VaultIdentifier', async () => {
      const vault = await vaultService.createVault({
        address: testAddress,
        chainId: testChainId,
        uuid: testUuid,
        name: 'Identifier Test',
        owner: testOwner,
      })

      const identifier = vaultService.createVaultIdentifier(vault)

      expect(identifier.address).toBe(vault.address)
      expect(identifier.chainId).toBe(vault.chainId)
      expect(identifier.uuid).toBe(vault.uuid)
      expect(identifier.name).toBe(vault.name)
      expect(identifier.caip10).toBe(vault.caip10)
      expect(identifier.shortAddress).toMatch(/^0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}$/)
    })
  })

  describe('getVaultsByChainId', () => {
    beforeEach(async () => {
      await vaultService.createVault({
        address: '0x1111111111111111111111111111111111111111' as Address,
        chainId: 8453, // Base
        uuid: '123e4567-e89b-12d3-a456-426614174020' as UUID,
        name: 'Base Vault',
        owner: testOwner,
      })

      await vaultService.createVault({
        address: '0x2222222222222222222222222222222222222222' as Address,
        chainId: testChainId, // Base Sepolia
        uuid: '123e4567-e89b-12d3-a456-426614174021' as UUID,
        name: 'Sepolia Vault',
        owner: testOwner,
      })
    })

    it('should retrieve vaults for specific chain', async () => {
      const vaults = await vaultService.getVaultsByChainId(testChainId)
      expect(vaults.length).toBeGreaterThanOrEqual(1)
      vaults.forEach((vault) => {
        expect(vault.chainId).toBe(testChainId)
      })
    })
  })

  describe('updateVault', () => {
    let vaultId: string

    beforeEach(async () => {
      const vault = await vaultService.createVault({
        address: testAddress,
        chainId: testChainId,
        uuid: testUuid,
        name: 'Original Name',
        owner: testOwner,
      })
      vaultId = vault.id
    })

    it('should update vault name', async () => {
      const updated = await vaultService.updateVault(
        vaultId,
        { name: 'Updated Name' },
        testOwner
      )

      expect(updated.name).toBe('Updated Name')
    })

    it('should update vault description', async () => {
      const updated = await vaultService.updateVault(
        vaultId,
        { description: 'New description' },
        testOwner
      )

      expect(updated.description).toBe('New description')
    })
  })

  describe('getVaultStats', () => {
    it('should return vault statistics', async () => {
      const vault = await vaultService.createVault({
        address: testAddress,
        chainId: testChainId,
        uuid: testUuid,
        name: 'Stats Test',
        owner: testOwner,
      })

      // Add additional members
      await vaultService.addMember({
        vaultId: vault.id,
        address: '0x7777777777777777777777777777777777777777' as Address,
        role: 'guardian',
        addedBy: testOwner,
      })

      const stats = await vaultService.getVaultStats(vault.id)

      expect(stats.memberCount).toBe(2) // Owner + 1 guardian
      expect(stats.createdAt).toBeDefined()
      expect(stats.updatedAt).toBeDefined()
    })
  })
})
