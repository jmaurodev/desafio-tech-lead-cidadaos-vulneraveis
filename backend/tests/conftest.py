"""
Test fixtures.

The cache is patched with minimal polars DataFrames so tests run without
needing the DuckDB file on disk.
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import polars as pl
import pytest
from fastapi.testclient import TestClient

from api.auth.jwt import create_token
from api.main import app

# ---------------------------------------------------------------------------
# Minimal DataFrames that satisfy every router's expectations
# ---------------------------------------------------------------------------

_SUBTIPO_ESTACIONAMENTO = "fiscalização de estacionamento"

_CHAMADOS = pl.DataFrame(
    {
        "id_chamado": ["1001", "1002", "1003"],
        "data_inicio": [datetime(2024, 1, 10), datetime(2024, 2, 5), datetime(2024, 3, 20)],
        "data_fim": [datetime(2024, 1, 15), None, datetime(2024, 3, 25)],
        "data_alvo_finalizacao": [
            datetime(2024, 1, 20),
            datetime(2024, 2, 20),
            datetime(2024, 3, 28),
        ],
        "prazo_tipo": ["f", "f", "f"],
        "prazo_unidade": ["d", "d", "d"],
        "tipo": ["3", "6", "3"],
        "subtipo": [_SUBTIPO_ESTACIONAMENTO, "reparo de buraco", _SUBTIPO_ESTACIONAMENTO],
        "secretaria": ["SMTR", "SEOP", "SMTR"],
        "status": ["fechado com providências", "aberto", "fechado com solução"],
        "situacao": ["encerrado", "não encerrado", "encerrado"],
        "longitude": [-43.17, -43.20, -43.18],
        "latitude": [-22.90, -22.92, -22.91],
        "data_particao": [
            datetime(2024, 1, 10),
            datetime(2024, 2, 5),
            datetime(2024, 3, 20),
        ],
        "duracao_dias": [5, 25, 5],
        "no_prazo": [True, None, True],
        "ano_mes": ["2024-01", "2024-02", "2024-03"],
    }
)

_KPI_GERAL = pl.DataFrame(
    {
        "total_chamados": [3],
        "total_encerrados": [2],
        "total_no_prazo": [2],
        "total_fora_prazo": [0],
        "total_em_andamento": [1],
        "tempo_medio_resolucao_dias": [5.0],
        "taxa_resolucao_prazo": [100.0],
        "data_mais_antiga": [datetime(2024, 1, 10)],
        "data_mais_recente": [datetime(2024, 3, 20)],
    }
)

_KPI_MENSAL = pl.DataFrame(
    {
        "ano_mes": ["2024-01", "2024-02", "2024-03"],
        "total_chamados": [1, 1, 1],
        "total_encerrados": [1, 0, 1],
        "total_no_prazo": [1, 0, 1],
        "total_fora_prazo": [0, 0, 0],
        "total_em_andamento": [0, 1, 0],
        "tempo_medio_resolucao_dias": [5.0, None, 5.0],
        "taxa_resolucao_prazo": [100.0, None, 100.0],
    }
)

_KPI_SECRETARIA = pl.DataFrame(
    {
        "secretaria": ["SMTR", "SEOP"],
        "total_chamados": [2, 1],
        "total_encerrados": [2, 0],
        "total_no_prazo": [2, 0],
        "total_fora_prazo": [0, 0],
        "tempo_medio_resolucao_dias": [5.0, None],
        "taxa_resolucao_prazo": [100.0, None],
    }
)

_TIPOS = pl.DataFrame(
    {
        "id_tipo_chamado": ["aaa", "bbb"],
        "tipo": ["3", "6"],
        "subtipo": [_SUBTIPO_ESTACIONAMENTO, "reparo de buraco"],
    }
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def patch_cache(monkeypatch):
    """Prevent DuckDB I/O in tests and inject minimal DataFrames."""
    import api.cache as cache_module

    # No-op startup so the lifespan doesn't touch DuckDB
    monkeypatch.setattr(cache_module, "startup", lambda: None)

    cache_module._store["chamados"] = _CHAMADOS
    cache_module._store["kpi_geral"] = _KPI_GERAL
    cache_module._store["kpi_mensal"] = _KPI_MENSAL
    cache_module._store["kpi_secretaria"] = _KPI_SECRETARIA
    cache_module._store["tipos"] = _TIPOS
    yield


@pytest.fixture
def client():
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


def _make_token(role: str, token_type: str = "access", expired: bool = False) -> str:
    ttl = timedelta(seconds=-1) if expired else timedelta(minutes=30)
    return create_token(sub="test-user", role=role, token_type=token_type, ttl=ttl)


@pytest.fixture
def operador_token():
    return _make_token("operador")


@pytest.fixture
def admin_token():
    return _make_token("admin")


@pytest.fixture
def superadmin_token():
    return _make_token("super_admin")


@pytest.fixture
def expired_token():
    return _make_token("operador", expired=True)
