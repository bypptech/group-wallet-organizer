/**
 * SessionService Integration Tests
 *
 * Tests for SessionService with JWT and database operations
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals'
import { SessionService } from '../../services/session-service'
import type { Address } from '@/packages/shared'

describe('SessionService Integration Tests', () => {
  let sessionService: SessionService
  const testUserAddress: Address = '0x1234567890123456789012345678901234567890'
  const testChainId = 84532 // Base Sepolia
  const testJwtSecret = 'test-secret-for-testing-only'

  beforeAll(() => {
    sessionService = new SessionService(testJwtSecret)
  })

  describe('createSession', () => {
    it('should create a session with valid parameters', async () => {
      const result = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })

      expect(result.session).toBeDefined()
      expect(result.token).toBeDefined()
      expect(result.session.userAddress).toBe(testUserAddress)
      expect(result.session.chainId).toBe(testChainId)
      expect(result.session.token).toBe(result.token)
    })

    it('should create session with custom expiration', async () => {
      const expiresIn = 60 * 60 // 1 hour
      const result = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
        expiresIn,
      })

      const expiresAt = new Date(result.session.expiresAt)
      const now = new Date()
      const diffInSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)

      expect(diffInSeconds).toBeGreaterThan(3500) // Close to 1 hour
      expect(diffInSeconds).toBeLessThan(3700)
    })

    it('should store IP address and user agent', async () => {
      const result = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser',
      })

      expect(result.session.ipAddress).toBe('192.168.1.1')
      expect(result.session.userAgent).toBe('Mozilla/5.0 Test Browser')
    })

    it('should generate valid JWT token', async () => {
      const result = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })

      // JWT format: header.payload.signature
      expect(result.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
    })
  })

  describe('validateToken', () => {
    let validToken: string
    let sessionId: string

    beforeEach(async () => {
      const result = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })
      validToken = result.token
      sessionId = result.session.id
    })

    it('should validate a valid token', async () => {
      const validation = await sessionService.validateToken(validToken)

      expect(validation.valid).toBe(true)
      expect(validation.session).toBeDefined()
      expect(validation.session?.userAddress).toBe(testUserAddress)
      expect(validation.error).toBeUndefined()
    })

    it('should reject invalid token format', async () => {
      const validation = await sessionService.validateToken('invalid-token')

      expect(validation.valid).toBe(false)
      expect(validation.error).toBeDefined()
      expect(validation.session).toBeUndefined()
    })

    it('should reject token with wrong secret', async () => {
      // Create session with different secret
      const otherService = new SessionService('different-secret')
      const { token: otherToken } = await otherService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })

      // Validate with original service
      const validation = await sessionService.validateToken(otherToken)

      expect(validation.valid).toBe(false)
      expect(validation.error).toBeDefined()
    })

    it('should update last accessed time on validation', async () => {
      const validation1 = await sessionService.validateToken(validToken)
      const firstAccess = validation1.session?.lastAccessedAt

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const validation2 = await sessionService.validateToken(validToken)
      const secondAccess = validation2.session?.lastAccessedAt

      expect(new Date(secondAccess!)).toBeInstanceOf(Date)
      expect(new Date(secondAccess!).getTime()).toBeGreaterThan(
        new Date(firstAccess!).getTime()
      )
    })
  })

  describe('getSessionByToken', () => {
    let testToken: string

    beforeEach(async () => {
      const result = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })
      testToken = result.token
    })

    it('should retrieve session by token', async () => {
      const session = await sessionService.getSessionByToken(testToken)

      expect(session).toBeDefined()
      expect(session?.token).toBe(testToken)
      expect(session?.userAddress).toBe(testUserAddress)
    })

    it('should return null for non-existent token', async () => {
      const session = await sessionService.getSessionByToken('non-existent-token')
      expect(session).toBeNull()
    })
  })

  describe('getSessionsByUser', () => {
    beforeEach(async () => {
      // Create multiple sessions for the same user
      await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })

      await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })

      await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: 8453, // Different chain
      })
    })

    it('should retrieve all sessions for a user', async () => {
      const sessions = await sessionService.getSessionsByUser(testUserAddress)

      expect(sessions.length).toBeGreaterThanOrEqual(3)
      sessions.forEach((session) => {
        expect(session.userAddress).toBe(testUserAddress)
      })
    })

    it('should filter sessions by chainId', async () => {
      const sessions = await sessionService.getSessionsByUser(testUserAddress, testChainId)

      expect(sessions.length).toBeGreaterThanOrEqual(2)
      sessions.forEach((session) => {
        expect(session.chainId).toBe(testChainId)
      })
    })
  })

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      const { session, token } = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })

      await sessionService.deleteSession(session.id)

      const retrievedSession = await sessionService.getSessionByToken(token)
      expect(retrievedSession).toBeNull()
    })
  })

  describe('deleteAllUserSessions', () => {
    beforeEach(async () => {
      // Create multiple sessions
      await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })
      await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })
    })

    it('should delete all sessions for a user', async () => {
      const deletedCount = await sessionService.deleteAllUserSessions(testUserAddress)

      expect(deletedCount).toBeGreaterThanOrEqual(2)

      const remainingSessions = await sessionService.getSessionsByUser(testUserAddress)
      expect(remainingSessions).toHaveLength(0)
    })

    it('should delete sessions for specific chain only', async () => {
      // Create session on different chain
      await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: 8453,
      })

      const deletedCount = await sessionService.deleteAllUserSessions(
        testUserAddress,
        testChainId
      )

      expect(deletedCount).toBeGreaterThanOrEqual(2)

      // Should still have session on other chain
      const remainingSessions = await sessionService.getSessionsByUser(testUserAddress, 8453)
      expect(remainingSessions.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('refreshSession', () => {
    it('should extend session expiration', async () => {
      const { session } = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
        expiresIn: 60, // 1 minute
      })

      const originalExpiresAt = new Date(session.expiresAt)

      // Refresh with longer expiration
      const refreshed = await sessionService.refreshSession(session.id, 60 * 60) // 1 hour

      const newExpiresAt = new Date(refreshed.expiresAt)

      expect(newExpiresAt.getTime()).toBeGreaterThan(originalExpiresAt.getTime())
    })
  })

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', async () => {
      // Create expired session (expires in -1 second = already expired)
      const { session } = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
        expiresIn: -1,
      })

      // Run cleanup
      const deletedCount = await sessionService.cleanupExpiredSessions()

      expect(deletedCount).toBeGreaterThanOrEqual(1)

      // Verify session is gone
      const retrievedSession = await sessionService.getSessionByToken(session.token)
      expect(retrievedSession).toBeNull()
    })
  })

  describe('getActiveSessionCount', () => {
    beforeEach(async () => {
      // Create active sessions
      await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })
      await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })

      // Create expired session
      await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
        expiresIn: -1,
      })
    })

    it('should count only active sessions', async () => {
      const count = await sessionService.getActiveSessionCount(testUserAddress)

      expect(count).toBeGreaterThanOrEqual(2)
    })
  })

  describe('getSessionDetails', () => {
    it('should return session details with expiration info', async () => {
      const { session } = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
        expiresIn: 3600, // 1 hour
      })

      const details = await sessionService.getSessionDetails(session.id)

      expect(details).toBeDefined()
      expect(details?.session).toBeDefined()
      expect(details?.isExpired).toBe(false)
      expect(details?.remainingTime).toBeGreaterThan(3500) // Close to 1 hour
    })

    it('should detect expired sessions', async () => {
      const { session } = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
        expiresIn: -1, // Already expired
      })

      const details = await sessionService.getSessionDetails(session.id)

      expect(details?.isExpired).toBe(true)
      expect(details?.remainingTime).toBe(0)
    })

    it('should return null for non-existent session', async () => {
      const details = await sessionService.getSessionDetails('non-existent-id')
      expect(details).toBeNull()
    })
  })

  describe('migrateSessionToChain', () => {
    it('should create new session on different chain', async () => {
      const { session: originalSession } = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
      })

      const newChainId = 8453 // Base
      const { session: newSession } = await sessionService.migrateSessionToChain(
        originalSession.id,
        newChainId
      )

      expect(newSession.chainId).toBe(newChainId)
      expect(newSession.userAddress).toBe(testUserAddress)
      expect(newSession.id).not.toBe(originalSession.id)

      // Old session should be deleted
      const oldSession = await sessionService.getSessionByToken(originalSession.token)
      expect(oldSession).toBeNull()
    })
  })

  describe('Session Expiration', () => {
    it('should reject validation of expired session', async () => {
      const { token } = await sessionService.createSession({
        userAddress: testUserAddress,
        chainId: testChainId,
        expiresIn: 1, // 1 second
      })

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const validation = await sessionService.validateToken(token)

      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('expired')
    })
  })
})
