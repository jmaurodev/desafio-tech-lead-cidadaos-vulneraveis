'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { KpiSecretaria } from '@/types/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SecretariaChartProps {
  readonly data: KpiSecretaria[]
}

export function SecretariaChart({ data }: SecretariaChartProps) {
  const chartData = [...data]
    .sort((a, b) => b.total_chamados - a.total_chamados)
    .slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Chamados por secretaria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 80, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <YAxis
              type="category"
              dataKey="secretaria"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) =>
                v.length > 12 ? v.slice(0, 12) + '…' : v
              }
              width={76}
            />
            <Tooltip
              formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString('pt-BR') : value,
                name === 'total_chamados' ? 'Total' : 'Encerrados',
              ]}
              labelFormatter={(label) => `Secretaria: ${label}`}
            />
            <Legend
              formatter={(value) =>
                value === 'total_chamados' ? 'Total' : 'Encerrados'
              }
            />
            <Bar dataKey="total_chamados" fill="#3b82f6" radius={[0, 3, 3, 0]} />
            <Bar dataKey="total_encerrados" fill="#22c55e" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
