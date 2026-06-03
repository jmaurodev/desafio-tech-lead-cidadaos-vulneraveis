import { decodeJwt } from 'jose'
import type { JwtPayload } from '@/types/api'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

function storage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export function getAccessToken(): string | null {
  return storage()?.getItem(ACCESS_KEY) ?? null
}

export function getRefreshToken(): string | null {
  return storage()?.getItem(REFRESH_KEY) ?? null
}

export function setTokens(access: string, refresh: string): void {
  const s = storage()
  if (!s) return
  s.setItem(ACCESS_KEY, access)
  s.setItem(REFRESH_KEY, refresh)
  // plain cookie readable by Edge Middleware for route protection
  document.cookie = `session=1; path=/; SameSite=Strict`
}

export function clearTokens(): void {
  const s = storage()
  if (!s) return
  s.removeItem(ACCESS_KEY)
  s.removeItem(REFRESH_KEY)
  document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict'
}

export function decodeAccessToken(): JwtPayload | null {
  const token = getAccessToken()
  if (!token) return null
  try {
    return decodeJwt(token) as JwtPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwt(token) as JwtPayload
    // 30-second buffer
    return payload.exp < Date.now() / 1000 + 30
  } catch {
    return true
  }
}
