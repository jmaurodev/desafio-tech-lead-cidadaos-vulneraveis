-- Tabela de fatos publicada — contrato estável consumido pela API.
-- Passthrough da intermediate (já limpa e enriquecida).
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
    encerrado,
    secretaria,
    id_bairro,
    nome_bairro,
    nome_subprefeitura,
    nome_regiao_administrativa,
    longitude,
    latitude,
    duracao_dias,
    no_prazo,
    ano_mes,
    data_particao
from {{ ref('int_adm_central_atendimento_1746_chamado') }}
