import { useQuery } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { getChamados, getChamado } from '@/lib/api/chamados'
import type { ChamadosFilters } from '@/types/api'

export function useChamados(filters: ChamadosFilters = {}) {
  return useQuery({
    queryKey: ['chamados', filters],
    queryFn: () => getChamados(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useChamado(id: string) {
  return useQuery({
    queryKey: ['chamado', id],
    queryFn: () => getChamado(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}
