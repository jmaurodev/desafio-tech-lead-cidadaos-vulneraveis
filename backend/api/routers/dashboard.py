from fastapi import APIRouter, Depends, Query

from ..aggregations import compute_dashboard
from ..auth.rbac import get_current_user
from ..cache import get_kpi_mensal_secretaria
from ..schemas.dashboard import DashboardResponse, KpiGeral

router = APIRouter()


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    mes_inicio: str | None = Query(None, description="Início da janela (YYYY-MM)"),
    mes_fim: str | None = Query(None, description="Fim da janela (YYYY-MM)"),
    _user: dict = Depends(get_current_user),
):
    result = compute_dashboard(get_kpi_mensal_secretaria(), mes_inicio, mes_fim)

    return DashboardResponse(
        kpi=KpiGeral(**result["kpi"]),
        por_mes=result["por_mes"],
        por_secretaria=result["por_secretaria"],
        mes_min=result["mes_min"],
        mes_max=result["mes_max"],
    )
