import { apiGet, apiFetch } from '@/lib/api-client'
import type { ChamadoItem, ChamadosFilters, PaginatedChamados } from '@/types/api'

function buildQuery(filters: ChamadosFilters): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== '' && v !== null) {
      params.set(k, String(v))
    }
  }
  return params.toString()
}

export function getChamados(filters: ChamadosFilters = {}): Promise<PaginatedChamados> {
  const qs = buildQuery(filters)
  return apiGet<PaginatedChamados>(`/chamados${qs ? '?' + qs : ''}`)
}

export function getChamado(id: string): Promise<ChamadoItem> {
  return apiGet<ChamadoItem>(`/chamados/${id}`)
}

export async function exportChamados(
  filters: Omit<ChamadosFilters, 'page' | 'page_size'>
): Promise<void> {
  const qs = buildQuery(filters)
  const res = await apiFetch(`/chamados/export${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error('Falha ao exportar')

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chamados_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
