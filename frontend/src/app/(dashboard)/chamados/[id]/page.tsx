'use client'

import { use } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import { useChamado } from '@/lib/hooks/use-chamados'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return iso
  }
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value ?? '—'}</dd>
    </div>
  )
}

export default function ChamadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: chamado, isLoading, error } = useChamado(id)

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <Link
        href="/chamados"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Chamado não encontrado ou erro ao carregar.</AlertDescription>
        </Alert>
      )}

      {chamado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="font-mono">{chamado.id_chamado}</span>
              {chamado.situacao && (
                <Badge variant={chamado.situacao === 'encerrado' ? 'secondary' : 'outline'}>
                  {chamado.situacao}
                </Badge>
              )}
              {chamado.no_prazo !== null && (
                <Badge
                  className={
                    chamado.no_prazo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {chamado.no_prazo ? 'No prazo' : 'Fora do prazo'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Tipo" value={chamado.tipo} />
              <Field label="Subtipo" value={chamado.subtipo} />
              <Field label="Secretaria" value={chamado.secretaria} />
              <Field label="Status" value={chamado.status} />
              <Field label="Duração" value={chamado.duracao_dias !== null ? `${chamado.duracao_dias} dias` : null} />
              <Field label="Mês/Ano" value={chamado.ano_mes} />
              <Field label="Abertura" value={formatDate(chamado.data_inicio)} />
              <Field label="Encerramento" value={formatDate(chamado.data_fim)} />
              <Field label="Prazo alvo" value={formatDate(chamado.data_alvo_finalizacao)} />
              {chamado.latitude && chamado.longitude && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-muted-foreground">Localização</dt>
                  <dd className="mt-0.5 text-sm font-mono">
                    {chamado.latitude.toFixed(6)}, {chamado.longitude.toFixed(6)}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
