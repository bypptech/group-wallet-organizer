import { SignJWT, jwtVerify } from 'jose'

const DEFAULT_ACCESS_TTL = 60 * 15 // 15 minutes
const DEFAULT_REFRESH_TTL = 60 * 60 * 24 * 7 // 7 days

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

export type JwtPayload = {
  sub: string
  username: string
  type: 'access' | 'refresh'
}

export const signAccessToken = async (payload: Omit<JwtPayload, 'type'>, ttlSec?: number) => {
  const secret = getSecret()
  const exp = Math.floor(Date.now() / 1000) + (ttlSec ?? DEFAULT_ACCESS_TTL)
  return await new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .setIssuedAt()
    .setSubject(payload.sub)
    .sign(secret)
}

export const signRefreshToken = async (payload: Omit<JwtPayload, 'type'>, ttlSec?: number) => {
  const secret = getSecret()
  const exp = Math.floor(Date.now() / 1000) + (ttlSec ?? DEFAULT_REFRESH_TTL)
  return await new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .setIssuedAt()
    .setSubject(payload.sub)
    .sign(secret)
}

export const verifyToken = async <T extends JwtPayload = JwtPayload>(token: string) => {
  const secret = getSecret()
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as T
}

