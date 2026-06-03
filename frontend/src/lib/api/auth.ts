import { getRefreshToken } from '@/lib/auth/token-store'
import { apiFetch } from '@/lib/api-client'
import type { TokenResponse } from '@/types/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function loginApi(username: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams({ username, password })
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Credenciais inválidas' }))
    throw new Error(err.detail ?? 'Credenciais inválidas')
  }
  return res.json()
}

export async function refreshApi(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json()
}

export async function logoutApi(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return
  await apiFetch('/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}
