import io
from typing import Literal

import polars as pl
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from ..auth.rbac import get_current_user
from ..cache import get_chamados
from ..schemas.chamado import PaginatedChamados

router = APIRouter()

_SORTABLE = {
    "id_chamado", "data_inicio", "data_fim", "tipo", "subtipo",
    "secretaria", "status", "situacao", "duracao_dias", "ano_mes",
}


def _apply_filters(
    df: pl.DataFrame,
    tipo: str | None,
    subtipo: str | None,
    secretaria: str | None,
    status: str | None,
    situacao: str | None,
    ano_mes: str | None,
    q: str | None,
) -> pl.DataFrame:
    if tipo:
        df = df.filter(pl.col("tipo") == tipo)
    if subtipo:
        df = df.filter(pl.col("subtipo") == subtipo)
    if secretaria:
        df = df.filter(pl.col("secretaria") == secretaria)
    if status:
        df = df.filter(pl.col("status") == status)
    if situacao:
        df = df.filter(pl.col("situacao") == situacao)
    if ano_mes:
        df = df.filter(pl.col("ano_mes") == ano_mes)
    if q:
        q_low = q.lower()
        df = df.filter(
            pl.col("id_chamado").str.contains(q_low)
            | pl.col("subtipo").str.to_lowercase().str.contains(q_low)
        )
    return df


@router.get("", response_model=PaginatedChamados)
def list_chamados(
    tipo: str | None = None,
    subtipo: str | None = None,
    secretaria: str | None = None,
    status: str | None = None,
    situacao: str | None = None,
    ano_mes: str | None = None,
    q: str | None = Query(None, description="Busca livre em id_chamado e subtipo"),
    sort_by: str = Query("data_inicio", description="Campo de ordenação"),
    sort_desc: bool = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    _user: dict = Depends(get_current_user),
):
    df = get_chamados()
    df = _apply_filters(df, tipo, subtipo, secretaria, status, situacao, ano_mes, q)

    if sort_by in _SORTABLE:
        df = df.sort(sort_by, descending=sort_desc, nulls_last=True)

    total = len(df)
    offset = (page - 1) * page_size
    items = df.slice(offset, page_size).to_dicts()

    return PaginatedChamados(
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, (total + page_size - 1) // page_size),
        items=items,
    )


@router.get("/export", summary="Exportar chamados filtrados como CSV")
def export_chamados(
    tipo: str | None = None,
    subtipo: str | None = None,
    secretaria: str | None = None,
    status: str | None = None,
    situacao: str | None = None,
    ano_mes: str | None = None,
    q: str | None = None,
    _user: dict = Depends(get_current_user),
):
    df = get_chamados()
    df = _apply_filters(df, tipo, subtipo, secretaria, status, situacao, ano_mes, q)

    buf = io.BytesIO()
    df.write_csv(buf)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=chamados.csv"},
    )


@router.get("/{id_chamado}", summary="Detalhe de um chamado")
def get_chamado(id_chamado: str, _user: dict = Depends(get_current_user)):
    df = get_chamados()
    row = df.filter(pl.col("id_chamado") == id_chamado)
    if len(row) == 0:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    return row.to_dicts()[0]
