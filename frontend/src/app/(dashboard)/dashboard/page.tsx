'use client'

import dynamic from 'next/dynamic'
import { useDashboard } from '@/lib/hooks/use-dashboard'
import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard()

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Central 1746 — visão geral de chamados
        </p>
      </div>

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
