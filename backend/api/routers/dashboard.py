from fastapi import APIRouter, Depends

from ..auth.rbac import get_current_user
from ..cache import get_kpi_geral, get_kpi_mensal, get_kpi_secretaria
from ..schemas.dashboard import DashboardResponse, KpiGeral

router = APIRouter()


@router.get("", response_model=DashboardResponse)
def get_dashboard(_user: dict = Depends(get_current_user)):
    kpi_row = get_kpi_geral().to_dicts()[0]

    kpi = KpiGeral(
        total_chamados=kpi_row["total_chamados"],
        total_encerrados=kpi_row["total_encerrados"],
        total_no_prazo=kpi_row["total_no_prazo"],
        total_fora_prazo=kpi_row["total_fora_prazo"],
        total_em_andamento=kpi_row["total_em_andamento"],
        tempo_medio_resolucao_dias=kpi_row["tempo_medio_resolucao_dias"],
        taxa_resolucao_prazo=kpi_row["taxa_resolucao_prazo"],
        data_mais_antiga=str(kpi_row["data_mais_antiga"]) if kpi_row["data_mais_antiga"] else None,
        data_mais_recente=str(kpi_row["data_mais_recente"]) if kpi_row["data_mais_recente"] else None,
    )

    return DashboardResponse(
        kpi=kpi,
        por_mes=get_kpi_mensal().to_dicts(),
        por_secretaria=get_kpi_secretaria().to_dicts(),
    )
