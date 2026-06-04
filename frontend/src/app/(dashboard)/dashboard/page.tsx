'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useDashboard } from '@/lib/hooks/use-dashboard'
import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { MonthRangeSlider } from '@/components/dashboard/MonthRangeSlider'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { DashboardFilters } from '@/types/api'

const MonthlyChart = dynamic(
  () => import('@/components/dashboard/MonthlyChart').then((m) => m.MonthlyChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const SecretariaChart = dynamic(
  () => import('@/components/dashboard/SecretariaChart').then((m) => m.SecretariaChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full rounded-md" />
      </CardContent>
    </Card>
  )
}

/** Gera a sequência de meses YYYY-MM entre min e max (inclusive). */
function monthRange(min: string, max: string): string[] {
  const [y0, m0] = min.split('-').map(Number)
  const [y1, m1] = max.split('-').map(Number)
  const out: string[] = []
  let y = y0
  let m = m0
  while (y < y1 || (y === y1 && m <= m1)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({})
  const { data, isLoading, error } = useDashboard(filters)

  const months = useMemo(
    () => (data?.mes_min && data?.mes_max ? monthRange(data.mes_min, data.mes_max) : []),
    [data?.mes_min, data?.mes_max]
  )

  // Índices do slider (controle visual durante o arraste)
  const [sliderIdx, setSliderIdx] = useState<[number, number] | null>(null)

  // Inicializa o slider no intervalo completo assim que o domínio é conhecido
  useEffect(() => {
    if (months.length > 0 && sliderIdx === null) {
      setSliderIdx([0, months.length - 1])
    }
  }, [months, sliderIdx])

  function handleCommit([a, b]: [number, number]) {
    const isFull = a === 0 && b === months.length - 1
    setFilters(isFull ? {} : { mes_inicio: months[a], mes_fim: months[b] })
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar dados do dashboard. Verifique se o backend está em execução.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const sliderValue: [number, number] = sliderIdx ?? [0, Math.max(0, months.length - 1)]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Central 1746 — visão geral de chamados
        </p>
      </div>

      {months.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <MonthRangeSlider
              months={months}
              value={sliderValue}
              onValueChange={setSliderIdx}
              onValueCommit={handleCommit}
            />
          </CardContent>
        </Card>
      )}

      <KpiGrid kpi={data?.kpi ?? ({} as never)} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <MonthlyChart data={data?.por_mes ?? []} />
            <SecretariaChart data={data?.por_secretaria ?? []} />
          </>
        )}
      </div>
    </div>
  )
}
