import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string | null, fmt = 'dd/MM/yyyy'): string {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), fmt, { locale: ptBR })
  } catch {
    return iso
  }
}

export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || value === undefined) return '—'
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: decimals })}%`
}

export function formatDays(days: number | null): string {
  if (days === null || days === undefined) return '—'
  return `${days.toLocaleString('pt-BR')} dia${days === 1 ? '' : 's'}`
}
