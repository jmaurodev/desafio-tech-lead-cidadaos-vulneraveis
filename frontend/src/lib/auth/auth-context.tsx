'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  clearTokens,
  decodeAccessToken,
  getRefreshToken,
  isTokenExpired,
  setTokens,
} from '@/lib/auth/token-store'
import { apiFetch } from '@/lib/api-client'
import type { JwtPayload, Role, TokenResponse } from '@/types/api'
import { ROLE_HIERARCHY } from '@/types/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface AuthContextValue {
  user: JwtPayload | null
  isLoading: boolean
  login(username: string, password: string): Promise<void>
  logout(): Promise<void>
  hasRole(minRole: Role): boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  function scheduleRefresh(payload: JwtPayload) {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const msUntilRefresh = (payload.exp - Date.now() / 1000 - 60) * 1000
    if (msUntilRefresh <= 0) return
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) return
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        if (!res.ok) throw new Error('refresh failed')
        const data: TokenResponse = await res.json()
        setTokens(data.access_token, data.refresh_token)
        const newPayload = decodeAccessToken()
        if (newPayload) {
          setUser(newPayload)
          scheduleRefresh(newPayload)
        }
      } catch {
        clearTokens()
        setUser(null)
        router.push('/login')
      }
    }, msUntilRefresh)
  }

  useEffect(() => {
    async function init() {
      try {
        let payload = decodeAccessToken()
        if (!payload) {
          setIsLoading(false)
          return
        }
        if (isTokenExpired(payload.exp.toString())) {
          const refreshToken = getRefreshToken()
          if (!refreshToken) {
            clearTokens()
            setIsLoading(false)
            return
          }
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })
          if (!res.ok) {
            clearTokens()
            setIsLoading(false)
            return
          }
          const data: TokenResponse = await res.json()
          setTokens(data.access_token, data.refresh_token)
          payload = decodeAccessToken()
        }
        if (payload) {
          setUser(payload)
          scheduleRefresh(payload)
        }
      } finally {
        setIsLoading(false)
      }
    }
    init()
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      const body = new URLSearchParams({ username, password })
      const res = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Falha na autenticação' }))
        throw new Error(err.detail ?? 'Falha na autenticação')
      }
      const data: TokenResponse = await res.json()
      setTokens(data.access_token, data.refresh_token)
      const payload = decodeAccessToken()
      if (payload) {
        setUser(payload)
        scheduleRefresh(payload)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      }
    } finally {
      clearTokens()
      setUser(null)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      router.push('/login')
    }
  }, [router])

  const hasRole = useCallback(
    (minRole: Role): boolean => {
      if (!user) return false
      return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole]
    },
    [user]
  )

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
