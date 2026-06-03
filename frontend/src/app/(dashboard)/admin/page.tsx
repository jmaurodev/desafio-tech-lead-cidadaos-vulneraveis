'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { useUsers } from '@/lib/hooks/use-users'
import { UsersTable } from '@/components/admin/UsersTable'
import { CreateUserDialog } from '@/components/admin/CreateUserDialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AdminPage() {
  const { hasRole } = useAuth()
  const { data: users, isLoading } = useUsers()
  const [showCreate, setShowCreate] = useState(false)

  if (!hasRole('admin')) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Acesso negado. Esta página é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de usuários</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crie, edite e remova usuários do sistema
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo usuário
        </Button>
      </div>

      <UsersTable users={users} isLoading={isLoading} />

      <CreateUserDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
