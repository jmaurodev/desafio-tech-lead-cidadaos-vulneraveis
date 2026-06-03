'use client'

import { useEffect, useState } from 'react'
import { useTipos } from '@/lib/hooks/use-tipos'
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
import { X } from 'lucide-react'
import type { ChamadosFilters } from '@/types/api'

const SECRETARIAS = [
  'COMLURB',
  'SMTR',
  'RIOLUZ',
  'SMS',
  'SEOP',
  'Rio-Águas',
  'SECONSERVA',
  'SMAC',
  'SMU',
  'Outros',
]

const SITUACOES = ['encerrado', 'não encerrado']

interface ChamadosFiltersProps {
  readonly filters: ChamadosFilters
  readonly onFilterChange: (filters: ChamadosFilters) => void
}

export function ChamadosFiltersPanel({ filters, onFilterChange }: ChamadosFiltersProps) {
  const { data: tiposMap } = useTipos()
  const [searchInput, setSearchInput] = useState(filters.q ?? '')

  const tipoKeys = tiposMap
    ? Object.keys(tiposMap).sort((a, b) => a.localeCompare(b))
    : []
  const subtipoOptions =
    filters.tipo && tiposMap
      ? (tiposMap[filters.tipo] ?? []).sort((a, b) => a.localeCompare(b))
      : []

  function update(patch: Partial<ChamadosFilters>) {
    onFilterChange({ ...filters, page: 1, ...patch })
  }

  function handleTipoChange(value: string) {
    update({ tipo: value || undefined, subtipo: undefined })
  }

  function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault()
    update({ q: searchInput || undefined })
  }

  function clearFilters() {
    setSearchInput('')
    onFilterChange({ page: 1, page_size: filters.page_size })
  }

  const hasActiveFilters =
    filters.tipo ||
    filters.subtipo ||
    filters.secretaria ||
    filters.situacao ||
    filters.q

  useEffect(() => {
    setSearchInput(filters.q ?? '')
  }, [filters.q])

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Buscar por ID ou subtipo…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" variant="outline" size="sm">
          Buscar
        </Button>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar
          </Button>
        )}
      </form>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select
            value={filters.tipo ?? ''}
            onValueChange={(v) => handleTipoChange(v ?? '')}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {tipoKeys.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Subtipo</Label>
          <Select
            value={filters.subtipo ?? ''}
            onValueChange={(v) => update({ subtipo: v || undefined })}
            disabled={!filters.tipo}
          >
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder={filters.tipo ? 'Todos' : 'Selecione tipo'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {subtipoOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.length > 30 ? s.slice(0, 30) + '…' : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Secretaria</Label>
          <Select
            value={filters.secretaria ?? ''}
            onValueChange={(v) => update({ secretaria: v || undefined })}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {SECRETARIAS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Situação</Label>
          <Select
            value={filters.situacao ?? ''}
            onValueChange={(v) => update({ situacao: v || undefined })}
          >
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {SITUACOES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
