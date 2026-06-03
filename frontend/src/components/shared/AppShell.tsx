'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PhoneCall,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ROLE_LABELS } from '@/types/api'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: undefined },
  { href: '/chamados', label: 'Chamados', icon: PhoneCall, minRole: undefined },
  { href: '/admin', label: 'Admin', icon: Users, minRole: 'admin' as const },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, hasRole } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const visibleItems = navItems.filter(
    (item) => !item.minRole || hasRole(item.minRole)
  )

  return (
    <div className="flex h-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar border-r border-border transition-transform duration-200',
          'lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center gap-2 px-4 border-b border-border">
          <PhoneCall className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">1746 Monitor</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator />
        <div className="p-3 space-y-2">
          <div className="px-2">
            <p className="text-xs font-medium truncate">{user?.sub}</p>
            {user?.role && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {ROLE_LABELS[user.role]}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-semibold text-sm">1746 Monitor</span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
