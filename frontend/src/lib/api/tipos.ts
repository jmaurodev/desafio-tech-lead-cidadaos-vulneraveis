import { apiGet } from '@/lib/api-client'
import type { TiposMap } from '@/types/api'

export function getTipos(): Promise<TiposMap> {
  return apiGet<TiposMap>('/tipos')
}
