select
    ano_mes,
    count(*)                                                                    as total_chamados,
    count(*) filter (where situacao = 'encerrado')                              as total_encerrados,
    count(*) filter (where no_prazo = true)                                     as total_no_prazo,
    count(*) filter (where no_prazo = false)                                    as total_fora_prazo,
    count(*) filter (where situacao = 'não encerrado')                          as total_em_andamento,
    round(avg(case when situacao = 'encerrado' then duracao_dias end), 1)       as tempo_medio_resolucao_dias,
    round(
        100.0
        * count(*) filter (where no_prazo = true)
        / nullif(count(*) filter (where situacao = 'encerrado'), 0),
        1
    )                                                                           as taxa_resolucao_prazo
from {{ ref('fct_adm_central_atendimento_1746_chamado') }}
where ano_mes is not null
group by ano_mes
order by ano_mes
