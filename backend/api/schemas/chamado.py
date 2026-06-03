from datetime import date, datetime
from pydantic import BaseModel


class ChamadoItem(BaseModel):
    id_chamado: str
    data_inicio: datetime | None
    data_fim: datetime | None
    data_alvo_finalizacao: datetime | None
    tipo: str | None
    subtipo: str | None
    secretaria: str | None
    status: str | None
    situacao: str | None
    longitude: float | None
    latitude: float | None
    duracao_dias: int | None
    no_prazo: bool | None
    ano_mes: str | None

    model_config = {"from_attributes": True}


class PaginatedChamados(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    items: list[dict]
