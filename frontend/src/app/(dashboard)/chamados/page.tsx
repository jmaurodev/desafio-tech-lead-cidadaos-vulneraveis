'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useChamados } from '@/lib/hooks/use-chamados'
import { ChamadosFiltersPanel } from '@/components/chamados/ChamadosFilters'
import { ChamadosTable } from '@/components/chamados/ChamadosTable'
import { ExportButton } from '@/components/chamados/ExportButton'
import type { ChamadosFilters } from '@/types/api'

function parseFilters(params: URLSearchParams): ChamadosFilters {
  return {
    tipo: params.get('tipo') ?? undefined,
    subtipo: params.get('subtipo') ?? undefined,
    secretaria: params.get('secretaria') ?? undefined,
    status: params.get('status') ?? undefined,
    situacao: params.get('situacao') ?? undefined,
    ano_mes: params.get('ano_mes') ?? undefined,
    q: params.get('q') ?? undefined,
    sort_by: params.get('sort_by') ?? 'data_inicio',
    sort_desc: params.get('sort_desc') !== 'false',
    page: params.has('page') ? Number(params.get('page')) : 1,
    page_size: params.has('page_size') ? Number(params.get('page_size')) : 20,
  }
}

function filtersToParams(f: ChamadosFilters): URLSearchParams {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(f)) {
    if (v !== undefined && v !== '' && v !== null) p.set(k, String(v))
  }
  return p
}

export default function ChamadosPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const filters = parseFilters(searchParams)

  const { data, isLoading } = useChamados(filters)

  const handleFilterChange = useCallback(
    (newFilters: ChamadosFilters) => {
      router.push(`/chamados?${filtersToParams(newFilters).toString()}`)
    },
    [router]
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chamados</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Listagem de chamados do 1746
          </p>
        </div>
        <ExportButton filters={filters} />
      </div>

      <ChamadosFiltersPanel filters={filters} onFilterChange={handleFilterChange} />

      <ChamadosTable
        data={data}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
    </div>
  )
}
