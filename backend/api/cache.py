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
        _store["chamados"] = con.execute("SELECT * FROM fct_chamados").pl()
        _store["kpi_geral"] = con.execute("SELECT * FROM mart_kpi_geral").pl()
        _store["kpi_mensal"] = con.execute("SELECT * FROM mart_kpi_mensal").pl()
        _store["kpi_secretaria"] = con.execute("SELECT * FROM mart_kpi_secretaria").pl()
        _store["tipos"] = con.execute(
            "SELECT * FROM dim_tipo_chamado ORDER BY tipo, subtipo"
        ).pl()
    finally:
        con.close()


def get_chamados() -> pl.DataFrame:
    return _store["chamados"]


def get_kpi_geral() -> pl.DataFrame:
    return _store["kpi_geral"]


def get_kpi_mensal() -> pl.DataFrame:
    return _store["kpi_mensal"]


def get_kpi_secretaria() -> pl.DataFrame:
    return _store["kpi_secretaria"]


def get_tipos() -> pl.DataFrame:
    return _store["tipos"]
