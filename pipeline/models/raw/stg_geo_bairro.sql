select
    id_bairro::varchar                   as id_bairro,
    nome::varchar                        as nome,
    id_area_planejamento::varchar        as id_area_planejamento,
    id_regiao_administrativa::varchar    as id_regiao_administrativa,
    nome_regiao_administrativa::varchar  as nome_regiao_administrativa,
    subprefeitura::varchar               as subprefeitura,
    geometry_wkt::varchar                as geometry_wkt
from {{ source('raw', 'raw_bairro') }}
