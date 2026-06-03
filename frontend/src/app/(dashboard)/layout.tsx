'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { AppShell } from '@/components/shared/AppShell'
import { PageLoader } from '@/components/shared/LoadingSpinner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) return <PageLoader />
  if (!user) return null

  return <AppShell>{children}</AppShell>
}
