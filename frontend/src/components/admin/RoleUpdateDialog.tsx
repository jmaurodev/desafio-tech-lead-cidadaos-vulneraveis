'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useUpdateUserRole } from '@/lib/hooks/use-users'
import { useAuth } from '@/lib/auth/auth-context'
import type { Role, UserResponse } from '@/types/api'
import { ROLE_HIERARCHY, ROLE_LABELS } from '@/types/api'

const ALL_ROLES: Role[] = ['operador', 'admin', 'super_admin']

interface RoleUpdateDialogProps {
  user: UserResponse
  open: boolean
  onClose: () => void
}

export function RoleUpdateDialog({ user, open, onClose }: RoleUpdateDialogProps) {
  const { user: currentUser } = useAuth()
  const updateRole = useUpdateUserRole()
  const [selectedRole, setSelectedRole] = useState<Role>(user.role)

  const allowedRoles = ALL_ROLES.filter(
    (r) => currentUser && ROLE_HIERARCHY[r] < ROLE_HIERARCHY[currentUser.role]
  )

  async function handleSave() {
    try {
      await updateRole.mutateAsync({ id: user.id, role: selectedRole })
      toast.success(`Role de "${user.username}" atualizado para ${ROLE_LABELS[selectedRole]}`)
      onClose()
    } catch (e) {
      toast.error('Erro ao atualizar role', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Alterar role — {user.username}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Novo role</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedRole === user.role || updateRole.isPending}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
