-- KPIs agregados por secretaria responsável para o dashboard.
-- secretaria vem da limpeza 2 (mapeamento por palavra-chave no subtipo).
-- Encerramento usa o indicador `encerrado` (limpeza 1). Ver docs/decisoes.md.
select
    secretaria,
    count(*)                                                          as total_chamados,
    count(*) filter (where encerrado)                                as total_encerrados,
    count(*) filter (where no_prazo = true)                          as total_no_prazo,
    count(*) filter (where no_prazo = false)                         as total_fora_prazo,
    round(avg(case when encerrado then duracao_dias end), 1)         as tempo_medio_resolucao_dias,
    round(
        100.0
        * count(*) filter (where no_prazo = true)
        / nullif(count(*) filter (where encerrado), 0),
        1
    )                                                                 as taxa_resolucao_prazo
from {{ ref('fct_adm_central_atendimento_1746_chamado') }}
group by secretaria
order by total_chamados desc
