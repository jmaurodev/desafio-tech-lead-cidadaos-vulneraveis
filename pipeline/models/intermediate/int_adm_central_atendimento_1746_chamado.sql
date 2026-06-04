with base as (
    select * from {{ ref('stg_adm_central_atendimento_1746_chamado') }}
),

bairro as (
    select * from {{ ref('stg_geo_bairro') }}
)

select
    base.id_chamado,
    base.data_inicio,
    base.data_fim,
    base.data_alvo_finalizacao,
    base.prazo_tipo,
    base.prazo_unidade,
    base.tipo,
    base.subtipo,
    base.status,
    base.situacao,
    base.id_bairro,
    bairro.nome                       as nome_bairro,
    bairro.subprefeitura              as nome_subprefeitura,
    bairro.nome_regiao_administrativa as nome_regiao_administrativa,
    base.longitude,
    base.latitude,
    base.data_particao,

    date_diff('day', base.data_inicio, coalesce(base.data_fim, current_timestamp))
        as duracao_dias,

    case
        when base.data_fim is null then null
        when base.data_fim <= base.data_alvo_finalizacao then true
        else false
    end as no_prazo,

    strftime(base.data_inicio, '%Y-%m') as ano_mes

from base
left join bairro on base.id_bairro = bairro.id_bairro
