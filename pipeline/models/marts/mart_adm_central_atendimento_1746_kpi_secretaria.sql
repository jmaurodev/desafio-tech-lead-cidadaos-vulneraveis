-- Aguardando coluna secretaria em fct_adm_central_atendimento_1746_chamado.
-- Este modelo será populado quando o mapeamento tipo → secretaria for adicionado.
select
    null::varchar as secretaria,
    null::bigint  as total_chamados,
    null::bigint  as total_encerrados,
    null::bigint  as total_no_prazo,
    null::bigint  as total_fora_prazo,
    null::double  as tempo_medio_resolucao_dias,
    null::double  as taxa_resolucao_prazo
where false
