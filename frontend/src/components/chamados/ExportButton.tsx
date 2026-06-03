'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportChamados } from '@/lib/api/chamados'
import type { ChamadosFilters } from '@/types/api'

interface ExportButtonProps {
  filters: ChamadosFilters
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const { page: _, page_size: __, sort_by: ___, sort_desc: ____, ...exportFilters } = filters
      await exportChamados(exportFilters)
      toast.success('Exportação concluída', {
        description: 'O arquivo CSV foi baixado.',
      })
    } catch {
      toast.error('Erro na exportação', {
        description: 'Não foi possível exportar os dados.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="h-3.5 w-3.5 mr-2" />
      {isExporting ? 'Exportando…' : 'Exportar CSV'}
    </Button>
  )
}
