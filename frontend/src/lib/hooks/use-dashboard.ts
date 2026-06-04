import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDashboard } from '@/lib/api/dashboard'
import type { DashboardFilters } from '@/types/api'

export function useDashboard(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['dashboard', filters],
    queryFn: () => getDashboard(filters),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}
