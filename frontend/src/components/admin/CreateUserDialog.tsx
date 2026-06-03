'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateUser } from '@/lib/hooks/use-users'
import { useAuth } from '@/lib/auth/auth-context'
import type { Role } from '@/types/api'
import { ROLE_HIERARCHY, ROLE_LABELS } from '@/types/api'

const ALL_ROLES: Role[] = ['operador', 'admin', 'super_admin']

const schema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['operador', 'admin', 'super_admin']),
})

type FormData = z.infer<typeof schema>

interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateUserDialog({ open, onClose }: CreateUserDialogProps) {
  const { user: currentUser } = useAuth()
  const createUser = useCreateUser()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'operador' },
  })

  const allowedRoles = ALL_ROLES.filter(
    (r) => currentUser && ROLE_HIERARCHY[r] < ROLE_HIERARCHY[currentUser.role]
  )

  async function onSubmit(data: FormData) {
    try {
      await createUser.mutateAsync(data)
      toast.success(`Usuário "${data.username}" criado com sucesso`)
      reset()
      onClose()
    } catch (e) {
      toast.error('Erro ao criar usuário', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Criar usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {createUser.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {createUser.error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="create-username">Usuário</Label>
            <Input
              id="create-username"
              placeholder="nome.usuario"
              {...register('username')}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-password">Senha</Label>
            <Input
              id="create-password"
              type="password"
              placeholder="••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={watch('role')}
              onValueChange={(v) => setValue('role', v as Role)}
            >
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
