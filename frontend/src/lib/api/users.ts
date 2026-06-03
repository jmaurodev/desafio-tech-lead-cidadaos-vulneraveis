import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'
import type { UserCreate, UserResponse, Role } from '@/types/api'

export function listUsers(): Promise<UserResponse[]> {
  return apiGet<UserResponse[]>('/users')
}

export function createUser(data: UserCreate): Promise<UserResponse> {
  return apiPost<UserResponse>('/users', data)
}

export function updateUserRole(id: string, role: Role): Promise<UserResponse> {
  return apiPut<UserResponse>(`/users/${id}/role`, { role })
}

export function deleteUser(id: string): Promise<void> {
  return apiDelete(`/users/${id}`)
}
