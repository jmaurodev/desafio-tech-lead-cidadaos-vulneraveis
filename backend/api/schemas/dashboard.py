from pydantic import BaseModel


class KpiGeral(BaseModel):
    total_chamados: int
    total_encerrados: int
    total_no_prazo: int
    total_fora_prazo: int
    total_em_andamento: int
    tempo_medio_resolucao_dias: float | None
    taxa_resolucao_prazo: float | None
    data_mais_antiga: str | None
    data_mais_recente: str | None


class DashboardResponse(BaseModel):
    kpi: KpiGeral
    por_mes: list[dict]
    por_secretaria: list[dict]
    mes_min: str | None
    mes_max: str | None
