with source as (
    select * from {{ source('raw', 'raw_chamados') }}
    where data_particao >= '2023-01-01'
)

select
    id_chamado::varchar                          as id_chamado,
    data_inicio::timestamp                       as data_inicio,
    data_fim::timestamp                          as data_fim,
    data_alvo_finalizacao::timestamp             as data_alvo_finalizacao,
    trim(lower(prazo_tipo))::varchar             as prazo_tipo,
    trim(lower(prazo_unidade))::varchar          as prazo_unidade,
    tipo::varchar                                as tipo,
    trim(lower(subtipo::varchar))::varchar       as subtipo,
    trim(lower(status::varchar))::varchar        as status,
    trim(lower(situacao::varchar))::varchar      as situacao,
    longitude::double                            as longitude,
    latitude::double                             as latitude,
    data_particao::date                          as data_particao
from source
