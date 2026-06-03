import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '@/lib/api/dashboard'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 5 * 60_000,
  })
}
