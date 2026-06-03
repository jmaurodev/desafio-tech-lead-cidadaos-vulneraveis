import { apiGet } from '@/lib/api-client'
import type { DashboardResponse } from '@/types/api'

export function getDashboard(): Promise<DashboardResponse> {
  return apiGet<DashboardResponse>('/dashboard')
}
