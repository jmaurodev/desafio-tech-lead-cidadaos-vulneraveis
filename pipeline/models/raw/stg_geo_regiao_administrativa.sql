select
    id_regiao_administrativa::varchar        as id_regiao_administrativa,
    nome::varchar                            as nome,
    id_area_planejamento::varchar            as id_area_planejamento,
    id_area_planejamento_numerico::varchar   as id_area_planejamento_numerico,
    geometry_wkt::varchar                    as geometry_wkt
from {{ source('raw', 'raw_regiao_administrativa') }}
