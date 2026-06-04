import { apiGet } from '@/lib/api-client'
import type { DashboardFilters, DashboardResponse } from '@/types/api'

function buildQuery(filters: DashboardFilters): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== '' && v !== null) {
      params.set(k, String(v))
    }
  }
  return params.toString()
}

export function getDashboard(filters: DashboardFilters = {}): Promise<DashboardResponse> {
  const qs = buildQuery(filters)
  return apiGet<DashboardResponse>(`/dashboard${qs ? '?' + qs : ''}`)
}
