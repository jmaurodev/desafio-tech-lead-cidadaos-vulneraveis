import { useQuery } from '@tanstack/react-query'
import { getTipos } from '@/lib/api/tipos'

export function useTipos() {
  return useQuery({
    queryKey: ['tipos'],
    queryFn: getTipos,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
