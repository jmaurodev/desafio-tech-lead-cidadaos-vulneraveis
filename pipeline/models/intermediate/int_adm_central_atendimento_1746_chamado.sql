-- Camada intermediária — chamados 1746 limpos e enriquecidos.
--
-- LIMPEZA 1 — data_fim como fonte da verdade para encerramento
--   `status` e `situacao` conflitam em alguns registros e não há indicação de
--   qual deva ter precedência. `data_fim` é um fato objetivo (timestamp de um
--   evento), >99% aderente a `situacao`, enquanto `status` carrega ruído.
--   Por isso o indicador `encerrado` é derivado exclusivamente de `data_fim`.
--   `status` e `situacao` são preservados brutos, como vêm do staging.
--
-- LIMPEZA 2 — secretaria responsável derivada de `subtipo`
--   O requisito sugere derivar a secretaria de `tipo`, mas a exploração mostrou
--   que `tipo` é ambíguo (mistura secretarias) e nulo em ~20% dos chamados,
--   enquanto `subtipo` é preciso e nunca nulo. A classificação usa regras de
--   palavra-chave sobre `subtipo`, em ordem de prioridade (primeiro match vence
--   — ex: "resíduos de poda" cai em Limpeza Urbana antes de Parques). Cobre
--   ~98%; o restante fica como 'indefinido' (cauda longa estadual/cross-cutting).
--   O fallback por `tipo` ficou redundante e foi omitido. Ver docs/decisoes.md.
--
-- ENRIQUECIMENTO — nome do bairro, subprefeitura e região administrativa,
--   via left join com stg_geo_bairro por id_bairro (id_bairro nulo → nulos).
--
-- CÁLCULOS — duracao_dias, no_prazo e ano_mes, derivados de data_inicio/data_fim.

with chamados as (
    select * from {{ ref('stg_adm_central_atendimento_1746_chamado') }}
),

bairro as (
    select * from {{ ref('stg_geo_bairro') }}
)

select
    chamados.id_chamado,
    chamados.data_inicio,
    chamados.data_fim,
    chamados.data_alvo_finalizacao,
    chamados.prazo_tipo,
    chamados.prazo_unidade,
    chamados.tipo,
    chamados.subtipo,
    chamados.status,
    chamados.situacao,
    chamados.id_bairro,
    bairro.nome                       as nome_bairro,
    bairro.subprefeitura              as nome_subprefeitura,
    bairro.nome_regiao_administrativa as nome_regiao_administrativa,
    chamados.longitude,
    chamados.latitude,
    chamados.data_particao,

    -- Limpeza 1: encerramento determinado pela presença de data_fim
    chamados.data_fim is not null as encerrado,

    -- Limpeza 2: secretaria responsável por palavra-chave no subtipo
    -- (subtipo já vem lowercase/trim do staging; ordem = prioridade)
    case
        -- Saúde
        when subtipo like '%aedes%' or subtipo like '%dengue%' or subtipo like '%consulta médica%' or subtipo like '%sisreg%' or subtipo like '%gestante%' or subtipo like '%medicament%' or subtipo like '%vacinação%' or subtipo like '%vacina%' or subtipo like '%saúde%' or subtipo like '%clínica da família%' or subtipo like '%clínicas da família%' or subtipo like '%- cf%' or subtipo like '%- hm%' or subtipo like '%- ps%' or subtipo like '% cf%' or subtipo like '% hm%' or subtipo like '%agente comunitário%' or subtipo like '%marcação de consulta%' or subtipo like '%zoonoses%' or subtipo like '%roedores%' or subtipo like '%caramujo%' or subtipo like '%castração%' or subtipo like '%clínico de animais%' or subtipo like '%clínico em animais%' or subtipo like '%insetos%' or subtipo like '%alimentos%' or subtipo like '%fiscalização sanitária%' or subtipo like '%higiene em mercados%' or subtipo like '%higiene em estabelecimentos%' or subtipo like '%sanitári%' or subtipo like '%médico%' or subtipo like '%hospita%' or subtipo like '%posto de saúde%' or subtipo like '%raiva%' or subtipo like '%morcego%' or subtipo like '%cães e gatos%' or subtipo like '%gato%' or subtipo like '%upa%' or subtipo like '%scs%' or subtipo like '%sms%' or subtipo like '%atenção primária%' or subtipo like '%exames de imagem%' or subtipo like '%pombos%' or subtipo like '%abelhas%' or subtipo like '%serviços de saúde%' or subtipo like '%fumacê%' or subtipo like '%caps%' or subtipo like '%conveniada%'
            then 'Saúde'
        -- Educação
        when subtipo like '%matrícula na rede%' or subtipo like '%escolar%' or subtipo like '%unidades escolares%' or subtipo like '%sme%' or subtipo like '%cre e unidades%' or subtipo like '%direção escolar%' or subtipo like '%creche%' or subtipo like '%educação%' or subtipo like '%educacion%' or subtipo like '%merenda%' or subtipo like '%professor%' or subtipo like '%escola%'
            then 'Educação'
        -- Assistência Social
        when subtipo like '%cadastro único%' or subtipo like '%cadúnico%' or subtipo like '%bolsa família%' or subtipo like '%cras%' or subtipo like '%assistência social%' or subtipo like '%atendimento social%' or subtipo like '%situação de rua%' or subtipo like '%centros de referência%' or subtipo like '%cartão família carioca%' or subtipo like '%conselho tutelar%' or subtipo like '%idoso%' or subtipo like '%idosa%' or subtipo like '%terceira idade%' or subtipo like '%prestação continuada%' or subtipo like '%acolhimento%' or subtipo like '%auxílio funeral%' or subtipo like '%auxílio gás%' or subtipo like '%post-mortem%' or subtipo like '%post mortem%' or subtipo like '%benefício%' or subtipo like '%abandono%' or subtipo like '%primeira infância%' or subtipo like '%prato feito%' or subtipo like '%cartão refeição%'
            then 'Assistência Social'
        -- Fazenda
        when subtipo like '%iptu%' or subtipo like '%dívida ativa%' or subtipo like '%iss%' or subtipo like '%itbi%' or subtipo like '%tributo%' or subtipo like '%inscrição imobiliária%' or subtipo like '%inscrição municipal%' or subtipo like '%nota carioca%' or subtipo like '%certidão de situação fiscal%' or subtipo like '%imposto%' or subtipo like '%auto de infração%' or subtipo like '%indébito%' or subtipo like '%darm%' or subtipo like '%aposentados e pensionistas%'
            then 'Fazenda'
        -- Transportes
        when subtipo like '%estacionamento irregular%' or subtipo like '%ônibus%' or subtipo like '%sinal de trânsito%' or subtipo like '%trânsito%' or subtipo like '%veículo rebocado%' or subtipo like '%veículo abandonado%' or subtipo like '%rebocado%' or subtipo like '%reboque%' or subtipo like '%enguiçado%' or subtipo like '%transporte complementar%' or subtipo like '%vans%' or subtipo like '%bilhetagem%' or subtipo like '%jaé%' or subtipo like '%riocard%' or subtipo like '%linha de ônibus%' or subtipo like '%motorista%' or subtipo like '%despachante%' or subtipo like '%multa%' or subtipo like '%quebra-molas%' or subtipo like '%cartão de estacionamento%' or subtipo like '%carcaça de veículo%' or subtipo like '%guardador%' or subtipo like '%rotativo%' or subtipo like '%táxi%' or subtipo like '%brt%' or subtipo like '%transoeste%' or subtipo like '%cmtc%' or subtipo like '%smtr%'
            then 'Transportes'
        -- Iluminação
        when subtipo like '%luminária%' or subtipo like '%lâmpada%' or subtipo like '%poste%' or subtipo like '%iluminação pública%' or subtipo like '%ponto de luz%'
            then 'Iluminação'
        -- Conservação
        when subtipo like '%buraco%' or subtipo like '%pista%' or subtipo like '%tampão%' or subtipo like '%grelha%' or subtipo like '%águas pluviais%' or subtipo like '%ralo%' or subtipo like '%calçada%' or subtipo like '%sinalização%' or subtipo like '%asfalto%' or subtipo like '%conservação de vias%' or subtipo like '%mobiliário urbano%' or subtipo like '%placa com nome de rua%' or subtipo like '%placas de identificação%' or subtipo like '%viaduto%' or subtipo like '%ponte%' or subtipo like '%guarda-corpo%' or subtipo like '%gradis%' or subtipo like '%rampa de acesso%'
            then 'Conservação'
        -- Urbanismo
        when subtipo like '%planta baixa%' or subtipo like '%planta de arquitetura%' or subtipo like '%licenciamento%' or subtipo like '%alvará de obras%' or subtipo like '%habite-se%' or subtipo like '%projeto aprovado%'
            then 'Urbanismo'
        -- Saneamento/Rio-Águas
        when subtipo like '%esgoto%' or subtipo like '%desentupimento%' or subtipo like '%drenagem%' or subtipo like '%falta de água%'
            then 'Saneamento/Rio-Águas'
        -- Defesa Civil
        when subtipo like '%rachadura%' or subtipo like '%infiltração%' or subtipo like '%desabamento%' or subtipo like '%desmoronamento%' or subtipo like '%defesa civil%' or subtipo like '%deslizamento%' or subtipo like '%encosta%' or subtipo like '%talude%' or subtipo like '%barreira%' or subtipo like '%arrimo%' or subtipo like '%contenção%' or subtipo like '%alerta e alarme%'
            then 'Defesa Civil'
        -- Ordem Pública
        when subtipo like '%perturbação do sossego%' or subtipo like '%obras em imóvel%' or subtipo like '%alvará%' or subtipo like '%ambulante%' or subtipo like '%atividades econômicas%' or subtipo like '%obstáculo%' or subtipo like '%carros de som%' or subtipo like '%ocupação de área pública%' or subtipo like '%ocupação irregular%' or subtipo like '%obras de concessionárias%' or subtipo like '%obras particulares%' or subtipo like '%terreno invadido%' or subtipo like '%sem licença%' or subtipo like '%fechamento de logradouro%' or subtipo like '%guarda municipal%' or subtipo like '%obras%' or subtipo like '%banca de jornal%' or subtipo like '%embelezamento%' or subtipo like '%publicidade%' or subtipo like '%patrimônio público%'
            then 'Ordem Pública'
        -- Procon
        when subtipo like '%procon%' or subtipo like '%consumidor%' or subtipo like '%fornecedores%'
            then 'Procon'
        -- Administração
        when subtipo like '%servidor%' or subtipo like '%contracheque%' or subtipo like '%recadastramento%' or subtipo like '%prova de vida%' or subtipo like '%pssm%' or subtipo like '%acesso à informação%' or subtipo like '%portal e app 1746%' or subtipo like '%portal 1746%' or subtipo like '%correção de falhas%' or subtipo like '%corrupção%' or subtipo like '%improbidade%' or subtipo like '%13º%' or subtipo like '%pecúlio%' or subtipo like '%pensão%' or subtipo like '%previ-rio%' or subtipo like '%concurso%' or subtipo like '%carioca digital%' or subtipo like '%ouvidoria%' or subtipo like '%central 1746%' or subtipo like '%qualidade do atendimento%' or subtipo like '%datas de pagamento%' or subtipo like '%iplan%' or subtipo like '%inativo%' or subtipo like '%folha de pagamento%' or subtipo like '%tempo de contribuição%' or subtipo like '%desconto em folha%' or subtipo like '%processamento de serviço%' or subtipo like '%gravação do atendimento%' or subtipo like '%atendimento 1746%'
            then 'Administração'
        -- Limpeza Urbana
        when subtipo like '%entulho%' or subtipo like '%resíduo%' or subtipo like '%varrição%' or subtipo like '%capina%' or subtipo like '%coleta%' or subtipo like '%limpeza%' or subtipo like '%papeleira%' or subtipo like '%contêiner%' or subtipo like '%caçamba%' or subtipo like '%lixo%' or subtipo like '%bens inservíveis%' or subtipo like '%praia%' or subtipo like '%animais mortos%' or subtipo like '%carcaça%' or subtipo like '%comlurb%' or subtipo like '%cremação de animais%'
            then 'Limpeza Urbana'
        -- Parques e Jardins
        when subtipo like '%árvore%' or subtipo like '%poda%' or subtipo like '%vegetação%' or subtipo like '%destoca%' or subtipo like '%praça%' or subtipo like '%parque%' or subtipo like '%brinquedos%' or subtipo like '%equipamentos esportivos%' or subtipo like '%esporte e lazer%' or subtipo like '%academias da terceira%'
            then 'Parques e Jardins'
        -- Meio Ambiente
        when subtipo like '%poluição%' or subtipo like '%animais silvestres%' or subtipo like '%maus tratos de animais%' or subtipo like '%cavalos, bois%' or subtipo like '%desmatamento%' or subtipo like '%defesa dos animais%' or subtipo like '%enxame%'
            then 'Meio Ambiente'
        else 'indefinido'
    end as secretaria,

    -- Cálculo: dias entre abertura e encerramento (ou hoje, se em aberto)
    date_diff('day', chamados.data_inicio, coalesce(chamados.data_fim, current_timestamp))
        as duracao_dias,

    -- Cálculo: cumprimento de SLA — só faz sentido para chamados encerrados
    case
        when chamados.data_fim is null then null
        when chamados.data_fim <= chamados.data_alvo_finalizacao then true
        else false
    end as no_prazo,

    -- Cálculo: ano-mês de abertura, para agregações temporais
    strftime(chamados.data_inicio, '%Y-%m') as ano_mes

from chamados
left join bairro on chamados.id_bairro = bairro.id_bairro
