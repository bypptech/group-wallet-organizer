import { Hono } from 'hono'
import { cors } from 'hono/cors'
import bcrypt from 'bcryptjs'
import { insertIntegrationSchema, insertWorkflowSchema } from '../../../packages/shared/src/index.js'
import { storage } from './storage.js'
import { getUncachableGitHubClient } from './githubClient.js'
import { requireAuth } from './auth/middleware.js'
import { signAccessToken, signRefreshToken } from './auth/jwt.js'

// Family Wallet API Routes
import vaultsRoutes from './routes/vaults.js'
import escrowsRoutes from './routes/escrows.js'
import policiesRoutes from './routes/policies.js'
import notificationsRoutes from './routes/notifications.js'
import paymasterRoutes from './routes/paymaster.js'
import paymasterSettingsRoutes from './routes/paymaster-settings.js'
import invitesRoutes from './routes/invites.js'
import auditLogsRoutes from './routes/audit-logs.js'
import collectionsRoutes from './routes/collections.js'
import shareableKeysRoutes from './routes/shareable-keys.js'
import iotControlRoutes from './routes/iot-control.js'

// In-Memory Storage Routes (fallback when DB is unavailable)
import vaultsMemoryRoutes from './routes/vaults-memory.js'
import notificationsMockRoutes from './routes/notifications-mock.js'
import paymasterMockRoutes from './routes/paymaster-mock.js'
import policiesMemoryRoutes from './routes/policies-memory.js'
import { mockMembers } from './mock/data.js'

const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173'
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true'

export const createHonoApp = () => {
  const app = new Hono()

  // CORS for split deploy (Option B)
  app.use('*', cors({
    origin: (origin) => origin ?? WEB_ORIGIN,
    allowHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }))

  // Health
  app.get('/health', (c) => c.json({ ok: true, mockMode: USE_MOCK_DATA }))

  // Family Wallet API Routes - Use mock or real based on environment
  if (USE_MOCK_DATA) {
    console.log('[api] Using MOCK data mode')

    // Shared in-memory storage for mock mode
    const mockInvites: any[] = []

    // Use the in-memory vaults routes
    app.route('/api/vaults', vaultsMemoryRoutes)
    app.route('/api/notifications', notificationsMockRoutes)
    app.route('/api/paymaster', paymasterMockRoutes)
    app.route('/api/policies', policiesMemoryRoutes)
    // Escrows will return empty arrays in mock mode
    app.get('/api/escrows', (c) => c.json({ escrows: [], total: 0 }))
    app.get('/api/invites', (c) => c.json({ invites: mockInvites, total: mockInvites.length }))
    app.get('/api/invites/by-vault/:vaultId', (c) => {
      const vaultId = c.req.param('vaultId')
      const query = c.req.query()
      const includeExpired = query.includeExpired !== 'false'
      const includeUsed = query.includeUsed !== 'false'

      let filteredInvites = mockInvites.filter(inv => inv.vaultId === vaultId)

      // Filter out expired invites if requested
      if (!includeExpired) {
        const now = new Date()
        filteredInvites = filteredInvites.filter(inv => new Date(inv.expiresAt) > now)
      }

      // Filter out used invites if requested
      if (!includeUsed) {
        filteredInvites = filteredInvites.filter(inv => !inv.usedAt)
      }

      return c.json({ invites: filteredInvites, total: filteredInvites.length })
    })
    app.get('/api/invites/:token', (c) => {
      const token = c.req.param('token')
      const invite = mockInvites.find(inv => inv.token === token)
      if (!invite) {
        return c.json({ error: 'Invite not found' }, 404)
      }
      // Check if expired
      if (new Date(invite.expiresAt) < new Date()) {
        return c.json({ error: 'Invite has expired', invite: { ...invite, expired: true } }, 410)
      }
      // Check if used
      if (invite.usedAt) {
        return c.json({ error: 'Invite has already been used', invite: { ...invite, used: true } }, 410)
      }
      return c.json({ invite })
    })
    app.post('/api/invites', async (c) => {
      try {
        const body = await c.req.json()
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const invite = {
          id: `invite-${Date.now()}`,
          token,
          ...body,
          createdAt: new Date().toISOString(),
          usedAt: null,
          usedBy: null,
        }
        mockInvites.push(invite)
        return c.json({ invite, inviteUrl: `${process.env.WEB_ORIGIN || 'http://localhost:5173'}/invite/${token}` }, 201)
      } catch (error) {
        return c.json({ error: 'Failed to create invite', details: error instanceof Error ? error.message : 'Unknown error' }, 500)
      }
    })
    app.post('/api/invites/:token/accept', async (c) => {
      try {
        const token = c.req.param('token')
        const body = await c.req.json()
        const invite = mockInvites.find(inv => inv.token === token)

        if (!invite) {
          return c.json({ error: 'Invite not found' }, 404)
        }
        if (new Date(invite.expiresAt) < new Date()) {
          return c.json({ error: 'Invite has expired' }, 410)
        }
        if (invite.usedAt) {
          return c.json({ error: 'Invite has already been used' }, 410)
        }

        // Mark as used
        invite.usedAt = new Date().toISOString()
        invite.usedBy = body.address

        // Add member to vault
        const newMember = {
          id: `member-${Date.now()}`,
          vaultId: invite.vaultId,
          address: body.address,
          role: invite.role,
          weight: invite.weight,
          addedAt: new Date().toISOString(),
          addedBy: invite.createdBy,
          metadata: {
            inviteToken: token,
            acceptedAt: new Date().toISOString()
          }
        }
        mockMembers.push(newMember)

        return c.json({
          success: true,
          member: newMember,
          message: 'Successfully joined the vault'
        })
      } catch (error) {
        return c.json({ error: 'Failed to accept invite', details: error instanceof Error ? error.message : 'Unknown error' }, 500)
      }
    })
    app.delete('/api/invites/:id', (c) => {
      const id = c.req.param('id')
      const inviteIndex = mockInvites.findIndex(inv => inv.id === id)

      if (inviteIndex === -1) {
        return c.json({ error: 'Invite not found' }, 404)
      }

      mockInvites.splice(inviteIndex, 1)
      return c.json({ success: true, message: 'Invite revoked successfully' })
    })
  } else {
    console.log('[api] Using REAL database mode')
    app.route('/api/vaults', vaultsRoutes)
    app.route('/api/escrows', escrowsRoutes)
    app.route('/api/policies', policiesRoutes)
    app.route('/api/notifications', notificationsRoutes)
    app.route('/api/paymaster', paymasterRoutes)
    app.route('/api/paymaster', paymasterSettingsRoutes) // Settings endpoints under /paymaster/settings/*
    app.route('/api/invites', invitesRoutes)
    app.route('/api/collections', collectionsRoutes)
    app.route('/api/shareable-keys', shareableKeysRoutes)
    app.route('/api/audit-logs', auditLogsRoutes)
    app.route('/api/shareable-keys', shareableKeysRoutes)
  }

  // IoT Control API Routes (available in both mock and real mode)
  app.route('/api', iotControlRoutes)

  // Auth: register
  app.post('/auth/register', async (c) => {
    try {
      const body = await c.req.json()
      const { username, password } = body as { username?: string; password?: string }
      if (!username || !password) return c.json({ message: 'username and password required' }, 400)
      const existing = await storage.getUserByUsername(username)
      if (existing) return c.json({ message: 'username already exists' }, 409)
      const hash = await bcrypt.hash(password, 10)
      const user = await storage.createUser({ username, password: hash })
      return c.json({ id: user.id, username: user.username }, 201)
    } catch (e) {
      console.error('register error', e)
      return c.json({ message: 'Failed to register' }, 500)
    }
  })

  // Auth: login
  app.post('/auth/login', async (c) => {
    try {
      const body = await c.req.json()
      const { username, password } = body as { username?: string; password?: string }
      if (!username || !password) return c.json({ message: 'username and password required' }, 400)
      const user = await storage.getUserByUsername(username)
      if (!user) return c.json({ message: 'invalid credentials' }, 401)
      const ok = await bcrypt.compare(password, user.password)
      if (!ok) return c.json({ message: 'invalid credentials' }, 401)

      const accessToken = await signAccessToken({ sub: user.id, username: user.username })
      const refreshToken = await signRefreshToken({ sub: user.id, username: user.username })
      return c.json({ accessToken, refreshToken, user: { id: user.id, username: user.username } })
    } catch (e) {
      console.error('login error', e)
      return c.json({ message: 'Failed to login' }, 500)
    }
  })

  // Auth: refresh
  app.post('/auth/refresh', async (c) => {
    try {
      const body = await c.req.json()
      const { refreshToken } = body as { refreshToken?: string }
      if (!refreshToken) return c.json({ message: 'refreshToken required' }, 400)
      const { sub, username, type } = await (await import('./auth/jwt')).verifyToken(refreshToken)
      if (type !== 'refresh') return c.json({ message: 'invalid token' }, 401)
      const accessToken = await signAccessToken({ sub: sub!, username: username as string })
      return c.json({ accessToken })
    } catch (e) {
      console.error('refresh error', e)
      return c.json({ message: 'Failed to refresh' }, 401)
    }
  })

  // Me (protected)
  app.get('/me', requireAuth, async (c) => {
    const user = c.get('user')
    return c.json({ user })
  })

  // Integrations
  app.get('/api/integrations', async (c) => {
    try {
      const integrations = await storage.getAllIntegrations()
      return c.json(integrations)
    } catch (error) {
      console.error('Error fetching integrations:', error)
      return c.json({ message: 'Failed to fetch integrations' }, 500)
    }
  })

  app.post('/api/integrations', requireAuth, async (c) => {
    try {
      const body = await c.req.json()
      const validation = insertIntegrationSchema.safeParse(body)
      if (!validation.success) {
        return c.json({ message: 'Invalid integration data', errors: validation.error.errors }, 400)
      }
      const integration = await storage.createIntegration(validation.data)
      return c.json(integration, 201)
    } catch (error) {
      console.error('Error creating integration:', error)
      return c.json({ message: 'Failed to create integration' }, 500)
    }
  })

  app.get('/api/integrations/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const integration = await storage.getIntegration(id)
      if (!integration) return c.json({ message: 'Integration not found' }, 404)
      return c.json(integration)
    } catch (error) {
      console.error('Error fetching integration:', error)
      return c.json({ message: 'Failed to fetch integration' }, 500)
    }
  })

  // Workflows
  app.get('/api/integrations/:id/workflows', async (c) => {
    try {
      const id = c.req.param('id')
      const workflows = await storage.getWorkflowsByIntegration(id)
      return c.json(workflows)
    } catch (error) {
      console.error('Error fetching workflows:', error)
      return c.json({ message: 'Failed to fetch workflows' }, 500)
    }
  })

  app.post('/api/integrations/:id/workflows', requireAuth, async (c) => {
    try {
      const id = c.req.param('id')
      const body = await c.req.json()
      const validation = insertWorkflowSchema.safeParse({ ...body, integrationId: id })
      if (!validation.success) {
        return c.json({ message: 'Invalid workflow data', errors: validation.error.errors }, 400)
      }
      const workflow = await storage.createWorkflow(validation.data)
      return c.json(workflow, 201)
    } catch (error) {
      console.error('Error creating workflow:', error)
      return c.json({ message: 'Failed to create workflow' }, 500)
    }
  })

  // GitHub integration
  app.post('/api/github/clone', async (c) => {
    try {
      const body = await c.req.json()
      const { repositories } = body as { repositories?: string[] }
      if (!repositories || !Array.isArray(repositories)) {
        return c.json({ message: 'repositories array is required' }, 400)
      }

      const github = await getUncachableGitHubClient()
      const results: any[] = []
      for (const repo of repositories) {
        try {
          const [owner, name] = repo.split('/')
          const { data } = await github.rest.repos.get({ owner, repo: name })
          results.push({
            repository: repo,
            status: 'success',
            data: {
              name: data.name,
              description: data.description,
              stars: data.stargazers_count,
              forks: data.forks_count,
              language: data.language,
              clone_url: data.clone_url,
            },
          })
        } catch (error) {
          results.push({
            repository: repo,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
      return c.json({ results })
    } catch (error) {
      console.error('Error cloning repositories:', error)
      return c.json({ message: 'Failed to process repositories' }, 500)
    }
  })

  app.post('/api/github/create-integration', async (c) => {
    try {
      const body = await c.req.json()
      const { name, tsumikiRepo, vibeKitRepo } = body as any
      if (!name || !tsumikiRepo || !vibeKitRepo) {
        return c.json({ message: 'name, tsumikiRepo, and vibeKitRepo are required' }, 400)
      }

      const github = await getUncachableGitHubClient()
      const [tsumikiOwner, tsumikiName] = (tsumikiRepo as string).split('/')
      const [vibeKitOwner, vibeKitName] = (vibeKitRepo as string).split('/')

      try {
        await github.rest.repos.get({ owner: tsumikiOwner, repo: tsumikiName })
        await github.rest.repos.get({ owner: vibeKitOwner, repo: vibeKitName })
      } catch (_error) {
        return c.json({ message: 'One or both repositories not found' }, 400)
      }

      const integration = await storage.createIntegration({
        name,
        status: 'initializing',
        repository: `integrated-${name}`,
        tsumikiVersion: 'latest',
        vibeKitVersion: 'latest',
      })

      await storage.createWorkflow({
        integrationId: integration.id,
        name: 'Repository Integration',
        step: 'clone',
        status: 'pending',
        output: JSON.stringify({ tsumikiRepo, vibeKitRepo }),
      })

      return c.json(integration, 201)
    } catch (error) {
      console.error('Error creating integration:', error)
      return c.json({ message: 'Failed to create integration' }, 500)
    }
  })

  return app
}
