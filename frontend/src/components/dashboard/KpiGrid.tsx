import {
  PhoneCall,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Timer,
} from 'lucide-react'
import { KpiCard, KpiCardSkeleton } from './KpiCard'
import type { KpiGeral } from '@/types/api'

function fmt(value: number | null, decimals = 1): string {
  if (value === null || value === undefined) return '—'
  return value.toLocaleString('pt-BR', { maximumFractionDigits: decimals })
}

interface KpiGridProps {
  kpi: KpiGeral
  isLoading?: boolean
}

export function KpiGrid({ kpi, isLoading }: KpiGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const taxaResolucao =
    kpi.taxa_resolucao_prazo !== null
      ? `${fmt(kpi.taxa_resolucao_prazo)}%`
      : '—'

  const tempoMedio =
    kpi.tempo_medio_resolucao_dias !== null
      ? `${fmt(kpi.tempo_medio_resolucao_dias)} dias`
      : '—'

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        title="Total de chamados"
        value={kpi.total_chamados.toLocaleString('pt-BR')}
        icon={PhoneCall}
      />
      <KpiCard
        title="Encerrados"
        value={kpi.total_encerrados.toLocaleString('pt-BR')}
        icon={CheckCircle}
      />
      <KpiCard
        title="Em andamento"
        value={kpi.total_em_andamento.toLocaleString('pt-BR')}
        icon={Clock}
      />
      <KpiCard
        title="No prazo"
        value={taxaResolucao}
        description={`${kpi.total_no_prazo.toLocaleString('pt-BR')} chamados`}
        icon={TrendingUp}
      />
      <KpiCard
        title="Fora do prazo"
        value={kpi.total_fora_prazo.toLocaleString('pt-BR')}
        icon={AlertCircle}
      />
      <KpiCard
        title="Tempo médio"
        value={tempoMedio}
        description="resolução"
        icon={Timer}
      />
    </div>
  )
}
