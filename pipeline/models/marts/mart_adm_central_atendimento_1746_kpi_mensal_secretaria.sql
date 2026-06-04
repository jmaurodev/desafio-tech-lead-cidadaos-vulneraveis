-- Mart de grão fino (ano_mes × secretaria) com medidas ADITIVAS.
--
-- É a única agregação pré-computada do dashboard. A API faz um rollup trivial
-- desta tabela (~centenas de linhas) para qualquer janela do slider de meses,
-- em vez de varrer o fato (~5M linhas) por request. Ver docs/decisoes.md.
--
-- Medidas não-aditivas (tempo médio, taxa) NÃO são guardadas prontas: como não
-- somam ao recortar um intervalo, guardamos seus COMPONENTES aditivos
-- (soma_duracao_encerrados + total_encerrados / total_no_prazo) e a API deriva
-- a média e a taxa em qualquer janela.
select
    ano_mes,
    secretaria,
    count(*)                                     as total_chamados,
    count(*) filter (where encerrado)            as total_encerrados,
    count(*) filter (where no_prazo = true)      as total_no_prazo,
    count(*) filter (where no_prazo = false)     as total_fora_prazo,
    count(*) filter (where not encerrado)        as total_em_andamento,
    sum(duracao_dias) filter (where encerrado)   as soma_duracao_encerrados,
    min(data_inicio)                             as data_mais_antiga,
    max(data_inicio)                             as data_mais_recente
from {{ ref('fct_adm_central_atendimento_1746_chamado') }}
where ano_mes is not null
group by ano_mes, secretaria
order by ano_mes, secretaria
