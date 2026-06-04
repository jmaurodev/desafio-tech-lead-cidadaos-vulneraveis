"""
In-memory cache loaded once at startup via FastAPI lifespan.
All query operations run on polars DataFrames — no DuckDB I/O per request.
"""
import polars as pl
from .database import get_connection

_store: dict[str, pl.DataFrame] = {}


def startup() -> None:
    con = get_connection()
    try:
        _store["chamados"] = con.execute(
            "SELECT * FROM fct_adm_central_atendimento_1746_chamado"
        ).pl()
        # Agregado de grão fino do dashboard: a API faz rollup desta tabela
        # pequena (mês × secretaria) por janela do slider (ver api/aggregations.py).
        _store["kpi_mensal_secretaria"] = con.execute(
            "SELECT * FROM mart_adm_central_atendimento_1746_kpi_mensal_secretaria"
        ).pl()
        _store["tipos"] = con.execute(
            "SELECT * FROM dim_adm_central_atendimento_1746_tipo_chamado ORDER BY tipo, subtipo"
        ).pl()
    finally:
        con.close()


def get_chamados() -> pl.DataFrame:
    return _store["chamados"]


def get_kpi_mensal_secretaria() -> pl.DataFrame:
    return _store["kpi_mensal_secretaria"]


def get_tipos() -> pl.DataFrame:
    return _store["tipos"]
