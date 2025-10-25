import type { Context, Next } from 'hono'
import { verifyToken } from './jwt'

export type AuthedUser = {
  id: string
  username: string
}

declare module 'hono' {
  interface ContextVariableMap {
    user?: AuthedUser
  }
}

export const requireAuth = async (c: Context, next: Next) => {
  const auth = c.req.header('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined
  if (!token) return c.json({ message: 'Unauthorized' }, 401)

  try {
    const payload = await verifyToken(token)
    if (payload.type !== 'access') return c.json({ message: 'Invalid token' }, 401)
    c.set('user', { id: payload.sub, username: payload.username })
    await next()
  } catch (_e) {
    return c.json({ message: 'Unauthorized' }, 401)
  }
}

