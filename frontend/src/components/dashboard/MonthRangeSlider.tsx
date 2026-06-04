'use client'

import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

function formatAnoMes(anoMes: string): string {
  try {
    return format(parse(anoMes, 'yyyy-MM', new Date()), "MMM/yy", { locale: ptBR })
  } catch {
    return anoMes
  }
}

function toPair(v: number | readonly number[]): [number, number] {
  const arr = Array.isArray(v) ? v : [v, v]
  return [arr[0] as number, arr[1] as number]
}

interface MonthRangeSliderProps {
  readonly months: string[]
  readonly value: [number, number]
  readonly onValueChange: (value: [number, number]) => void
  readonly onValueCommit: (value: [number, number]) => void
}

export function MonthRangeSlider({
  months,
  value,
  onValueChange,
  onValueCommit,
}: MonthRangeSliderProps) {
  const [start, end] = value
  const max = Math.max(0, months.length - 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Período</Label>
        <span className="text-sm text-muted-foreground tabular-nums">
          {months[start] ? formatAnoMes(months[start]) : '—'}
          {' — '}
          {months[end] ? formatAnoMes(months[end]) : '—'}
        </span>
      </div>
      <Slider
        min={0}
        max={max}
        step={1}
        value={[start, end]}
        onValueChange={(v) => onValueChange(toPair(v))}
        onValueCommitted={(v) => onValueCommit(toPair(v))}
      />
    </div>
  )
}
