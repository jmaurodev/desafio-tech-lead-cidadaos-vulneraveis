'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChamadoItem, ChamadosFilters, PaginatedChamados } from '@/types/api'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'dd/MM/yy HH:mm', { locale: ptBR })
  } catch {
    return iso
  }
}

function NoPrazoBadge({ value }: { value: boolean | null }) {
  if (value === null) return <Badge variant="secondary">Em aberto</Badge>
  if (value) return <Badge className="bg-green-100 text-green-800 border-green-200">No prazo</Badge>
  return <Badge variant="destructive">Fora do prazo</Badge>
}

interface SortableHeaderProps {
  column: string
  label: string
  currentSort: string | undefined
  sortDesc: boolean | undefined
  onSort: (col: string) => void
}

function SortableHeader({ column, label, currentSort, sortDesc, onSort }: SortableHeaderProps) {
  const active = currentSort === column
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-7 text-xs font-medium"
      onClick={() => onSort(column)}
    >
      {label}
      {active ? (
        sortDesc ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUp className="ml-1 h-3 w-3" />
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
      )}
    </Button>
  )
}

interface ChamadosTableProps {
  data: PaginatedChamados | undefined
  isLoading: boolean
  filters: ChamadosFilters
  onFilterChange: (f: ChamadosFilters) => void
}

export function ChamadosTable({ data, isLoading, filters, onFilterChange }: ChamadosTableProps) {
  function handleSort(col: string) {
    const isSame = filters.sort_by === col
    onFilterChange({
      ...filters,
      sort_by: col,
      sort_desc: isSame ? !filters.sort_desc : true,
      page: 1,
    })
  }

  function goToPage(p: number) {
    onFilterChange({ ...filters, page: p })
  }

  const page = filters.page ?? 1
  const pages = data?.pages ?? 1
  const total = data?.total ?? 0

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortableHeader
                  column="id_chamado"
                  label="ID"
                  currentSort={filters.sort_by}
                  sortDesc={filters.sort_desc}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  column="data_inicio"
                  label="Abertura"
                  currentSort={filters.sort_by}
                  sortDesc={filters.sort_desc}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead className="hidden lg:table-cell">Subtipo</TableHead>
              <TableHead className="hidden md:table-cell">Secretaria</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortableHeader
                  column="duracao_dias"
                  label="Duração"
                  currentSort={filters.sort_by}
                  sortDesc={filters.sort_desc}
                  onSort={handleSort}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum chamado encontrado
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((item: ChamadoItem) => (
              <TableRow key={item.id_chamado} className="text-xs">
                <TableCell>
                  <Link
                    href={`/chamados/${item.id_chamado}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {item.id_chamado}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(item.data_inicio)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.tipo ?? '—'}
                </TableCell>
                <TableCell className="hidden lg:table-cell max-w-xs truncate">
                  {item.subtipo ?? '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.secretaria ?? '—'}
                </TableCell>
                <TableCell>
                  {item.situacao ? (
                    <Badge variant={item.situacao === 'encerrado' ? 'secondary' : 'outline'}>
                      {item.situacao}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <NoPrazoBadge value={item.no_prazo} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {item.duracao_dias !== null ? `${item.duracao_dias}d` : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {total.toLocaleString('pt-BR')} chamados · página {page} de {pages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page >= pages}
            onClick={() => goToPage(page + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
