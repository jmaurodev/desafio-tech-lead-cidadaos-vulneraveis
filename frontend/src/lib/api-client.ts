import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@/lib/auth/token-store'
import type { TokenResponse } from '@/types/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

let _isRefreshing = false
let _pendingQueue: Array<(token: string) => void> = []

function processPendingQueue(newToken: string) {
  _pendingQueue.forEach((cb) => cb(newToken))
  _pendingQueue = []
}

async function doRefresh(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    clearTokens()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('Refresh failed')
  }

  const data: TokenResponse = await res.json()
  setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${path}`
  const accessToken = getAccessToken()

  const headers = new Headers(init.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const res = await fetch(url, { ...init, headers })

  if (res.status !== 401) return res

  // Handle 401 with token refresh
  if (_isRefreshing) {
    return new Promise<Response>((resolve, reject) => {
      _pendingQueue.push(async (newToken) => {
        headers.set('Authorization', `Bearer ${newToken}`)
        try {
          resolve(await fetch(url, { ...init, headers }))
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  _isRefreshing = true
  try {
    const newToken = await doRefresh()
    processPendingQueue(newToken)
    headers.set('Authorization', `Bearer ${newToken}`)
    return fetch(url, { ...init, headers })
  } catch (e) {
    _pendingQueue = []
    throw e
  } finally {
    _isRefreshing = false
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function apiDelete(path: string): Promise<void> {
  const res = await apiFetch(path, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `Request failed: ${res.status}`)
  }
}
