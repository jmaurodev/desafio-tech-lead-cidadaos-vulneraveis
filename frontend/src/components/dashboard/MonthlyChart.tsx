'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { KpiMensal } from '@/types/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatAnoMes(anoMes: string): string {
  try {
    return format(parse(anoMes, 'yyyy-MM', new Date()), 'MMM yy', { locale: ptBR })
  } catch {
    return anoMes
  }
}

interface MonthlyChartProps {
  readonly data: KpiMensal[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = [...data]
    .sort((a, b) => a.ano_mes.localeCompare(b.ano_mes))
    .map((d) => ({
      ...d,
      label: formatAnoMes(d.ano_mes),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução mensal de chamados</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEncerrados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip
              formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString('pt-BR') : value,
                name === 'total_chamados' ? 'Total' : 'Encerrados',
              ]}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Legend
              formatter={(value) =>
                value === 'total_chamados' ? 'Total' : 'Encerrados'
              }
            />
            <Area
              type="monotone"
              dataKey="total_chamados"
              stroke="#3b82f6"
              fill="url(#colorTotal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="total_encerrados"
              stroke="#22c55e"
              fill="url(#colorEncerrados)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
