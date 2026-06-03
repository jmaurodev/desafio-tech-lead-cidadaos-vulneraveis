select distinct
    md5(tipo || '|' || coalesce(subtipo, '')) as id_tipo_chamado,
    tipo,
    subtipo
from {{ ref('int_adm_central_atendimento_1746_chamado') }}
where tipo is not null
