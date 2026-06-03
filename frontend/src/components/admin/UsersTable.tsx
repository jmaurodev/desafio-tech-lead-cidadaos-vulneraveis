'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Shield } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteUser } from '@/lib/hooks/use-users'
import { useAuth } from '@/lib/auth/auth-context'
import type { UserResponse } from '@/types/api'
import { ROLE_HIERARCHY, ROLE_LABELS } from '@/types/api'
import { RoleUpdateDialog } from './RoleUpdateDialog'

function roleBadgeVariant(role: UserResponse['role']) {
  if (role === 'super_admin') return 'default'
  if (role === 'admin') return 'secondary'
  return 'outline'
}

interface UsersTableProps {
  users: UserResponse[] | undefined
  isLoading: boolean
}

export function UsersTable({ users, isLoading }: UsersTableProps) {
  const { user: currentUser } = useAuth()
  const deleteUser = useDeleteUser()
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null)
  const [roleTarget, setRoleTarget] = useState<UserResponse | null>(null)

  function canModify(target: UserResponse): boolean {
    if (!currentUser) return false
    return ROLE_HIERARCHY[currentUser.role] > ROLE_HIERARCHY[target.role]
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteUser.mutateAsync(deleteTarget.id)
      toast.success(`Usuário "${deleteTarget.username}" removido`)
    } catch (e) {
      toast.error('Erro ao remover usuário', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
            {users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.username}</TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant(u.role)}>
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.active ? 'default' : 'secondary'}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!canModify(u)}
                      onClick={() => setRoleTarget(u)}
                      title="Alterar role"
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      disabled={!canModify(u)}
                      onClick={() => setDeleteTarget(u)}
                      title="Excluir usuário"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário{' '}
              <strong>{deleteTarget?.username}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role update dialog */}
      {roleTarget && (
        <RoleUpdateDialog
          user={roleTarget}
          open={!!roleTarget}
          onClose={() => setRoleTarget(null)}
        />
      )}
    </>
  )
}
