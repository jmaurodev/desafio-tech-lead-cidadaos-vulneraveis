from fastapi import APIRouter, Depends

from ..auth.rbac import get_current_user
from ..cache import get_tipos

router = APIRouter()


@router.get("", summary="Tipos e subtipos disponíveis (para filtros em cascata)")
def list_tipos(_user: dict = Depends(get_current_user)):
    df = get_tipos()
    # Group subtipos under each tipo for cascading filter UX
    result: dict[str, list[str]] = {}
    for row in df.to_dicts():
        tipo = row["tipo"] or "sem_tipo"
        subtipo = row["subtipo"]
        result.setdefault(tipo, [])
        if subtipo:
            result[tipo].append(subtipo)
    return result
