-- KPIs gerais (linha única) para o cabeçalho do dashboard.
-- Encerramento usa o indicador `encerrado` (derivado de data_fim na limpeza 1),
-- não mais `situacao`, que é ruidosa. Ver docs/decisoes.md.
select
    count(*)                                                          as total_chamados,
    count(*) filter (where encerrado)                                as total_encerrados,
    count(*) filter (where no_prazo = true)                          as total_no_prazo,
    count(*) filter (where no_prazo = false)                         as total_fora_prazo,
    count(*) filter (where not encerrado)                            as total_em_andamento,
    round(avg(case when encerrado then duracao_dias end), 1)         as tempo_medio_resolucao_dias,
    round(
        100.0
        * count(*) filter (where no_prazo = true)
        / nullif(count(*) filter (where encerrado), 0),
        1
    )                                                                 as taxa_resolucao_prazo,
    min(data_inicio)                                                 as data_mais_antiga,
    max(data_inicio)                                                 as data_mais_recente
from {{ ref('fct_adm_central_atendimento_1746_chamado') }}
