with base as (
    select * from {{ ref('stg_adm_central_atendimento_1746_chamado') }}
)

select
    id_chamado,
    data_inicio,
    data_fim,
    data_alvo_finalizacao,
    prazo_tipo,
    prazo_unidade,
    tipo,
    subtipo,
    status,
    situacao,
    longitude,
    latitude,
    data_particao,

    date_diff('day', data_inicio, coalesce(data_fim, current_timestamp))
        as duracao_dias,

    case
        when data_fim is null then null
        when data_fim <= data_alvo_finalizacao then true
        else false
    end as no_prazo,

    strftime(data_inicio, '%Y-%m') as ano_mes

from base
