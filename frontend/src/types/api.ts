export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface JwtPayload {
  sub: string
  role: Role
  type: 'access' | 'refresh'
  iat: number
  exp: number
}

export type Role = 'operador' | 'admin' | 'super_admin'

export const ROLE_HIERARCHY: Record<Role, number> = {
  operador: 0,
  admin: 1,
  super_admin: 2,
}

export const ROLE_LABELS: Record<Role, string> = {
  operador: 'Operador',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

export interface UserResponse {
  id: string
  username: string
  role: Role
  active: boolean
}

export interface UserCreate {
  username: string
  password: string
  role: Role
}

export interface ChamadoItem {
  id_chamado: string
  data_inicio: string | null
  data_fim: string | null
  data_alvo_finalizacao: string | null
  tipo: string | null
  subtipo: string | null
  secretaria: string | null
  status: string | null
  situacao: string | null
  longitude: number | null
  latitude: number | null
  duracao_dias: number | null
  no_prazo: boolean | null
  ano_mes: string | null
}

export interface PaginatedChamados {
  total: number
  page: number
  page_size: number
  pages: number
  items: ChamadoItem[]
}

export interface ChamadosFilters {
  tipo?: string
  subtipo?: string
  secretaria?: string
  status?: string
  situacao?: string
  ano_mes?: string
  q?: string
  sort_by?: string
  sort_desc?: boolean
  page?: number
  page_size?: number
}

export interface KpiGeral {
  total_chamados: number
  total_encerrados: number
  total_no_prazo: number
  total_fora_prazo: number
  total_em_andamento: number
  tempo_medio_resolucao_dias: number | null
  taxa_resolucao_prazo: number | null
  data_mais_antiga: string | null
  data_mais_recente: string | null
}

export interface KpiMensal {
  ano_mes: string
  total_chamados: number
  total_encerrados: number
  total_no_prazo: number
  total_fora_prazo: number
  total_em_andamento: number
  tempo_medio_resolucao_dias: number | null
  taxa_resolucao_prazo: number | null
}

export interface KpiSecretaria {
  secretaria: string
  total_chamados: number
  total_encerrados: number
  total_no_prazo: number
  total_fora_prazo: number
  tempo_medio_resolucao_dias: number | null
  taxa_resolucao_prazo: number | null
}

export interface DashboardResponse {
  kpi: KpiGeral
  por_mes: KpiMensal[]
  por_secretaria: KpiSecretaria[]
  mes_min: string | null
  mes_max: string | null
}

export interface DashboardFilters {
  mes_inicio?: string
  mes_fim?: string
}

export type TiposMap = Record<string, string[]>
