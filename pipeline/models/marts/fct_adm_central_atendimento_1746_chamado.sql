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
    duracao_dias,
    no_prazo,
    ano_mes
from {{ ref('int_adm_central_atendimento_1746_chamado') }}
