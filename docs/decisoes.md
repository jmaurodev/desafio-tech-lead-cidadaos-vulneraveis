# Decisões

> queremos ver como você pensa, não só o que você construiu

## Escolhas Tecnológicas

### Repositório

Estrutura real do monorepo:

```text
desafio-tech-lead-cidadaos-vulneraveis/
├── README.md                # como rodar tudo (install/test/start)
├── docs/decisoes.md
├── data/                    # CSVs do BigQuery + DuckDB (não commitados)
├── pipeline/                # dbt + DuckDB
│   ├── models/{raw,intermediate,marts}/
│   ├── scripts/load_raw.py  # carga dos CSVs no DuckDB
│   └── dbt_project.yml
├── backend/                 # FastAPI + Polars
│   ├── api/{routers,auth,schemas}/
│   └── tests/
└── frontend/                # Next.js (App Router)
    └── src/
```

Para a avaliação segui a sugestão de **um único repositório**. Em produção eu
defenderia separar em `dados` / `backend` / `frontend` / `gateway`, pelos motivos
de sempre: responsabilidades e tecnologias distintas, *need-to-know* (quem mexe no
frontend não precisa de acesso ao ETL) e CI/CD mais simples por pipeline.

### Gerenciadores de dependências

- **Python → [uv](https://docs.astral.sh/uv/)** em vez de `pip`/`poetry`:
  resolução de dependências em grafo e implementação em Rust (rápido).
- **TypeScript → [pnpm](https://pnpm.io/)** em vez de `npm`: mais rápido e
  eficiente em disco (store com hardlinks).

### Stack por camada

| Camada | Escolha | Por quê |
|---|---|---|
| Pipeline | **dbt + DuckDB** | DuckDB era novo pra mim; depois de estudar, é o engine OLAP ideal pra processar milhões de linhas localmente sem subir infra. dbt dá versionamento, testes e linhagem das transformações. |
| Backend | **FastAPI + Polars** | Marts já agregados são pequenos; carrego em DataFrames Polars na memória e sirvo filtragem/ordenação/paginação sem tocar no disco por requisição. |
| Frontend | **Next.js (App Router) + shadcn/ui + TanStack Query + Recharts** | Sugestão do enunciado; App Router para guards via middleware e Server Components. |

## Limpeza de dados

A limpeza acontece na camada `intermediate` do dbt. A camada `raw` (staging) faz
apenas tipagem e normalização de texto — não decide nada sobre o significado do
dado. Cada limpeza é documentada aqui, numerada, para deixar o raciocínio
rastreável. **Os campos brutos são sempre preservados**; as regras de negócio
ficam em colunas derivadas, numa camada acima — auditável e reversível.

### Limpeza 1 — `data_fim` como fonte da verdade para encerramento

**Problema.** `status` e `situacao` se contradizem em alguns chamados
(ex: `situacao = 'Encerrado'` com `status = 'Em Andamento'`) e os dados não dizem
qual tem precedência.

**Como decidi.** Em vez de escolher um campo no arbítrio, ancorei num fato
objetivo: `data_fim` é um timestamp de evento, não um rótulo digitado. Cruzando
`situacao × status` contra a presença de `data_fim`:

- `situacao = 'Não Encerrado'` → **100%** sem `data_fim`
- `situacao = 'Encerrado'` → **>99%** com `data_fim`
- conflitos "duros" (status aberto + situação encerrada): **13 linhas** em ~5M.

Ou seja, `situacao` é praticamente um espelho de `data_fim` e `status` é o campo
ruidoso. `data_fim` é o sinal mais confiável.

**O que fiz.** Derivei `encerrado := data_fim is not null` na intermediate e passei
a usá-lo em todos os marts/KPIs. `status` e `situacao` ficam **brutos**.

**Tradeoff aceito.** ~14,7 mil chamados com `situacao = 'Encerrado'` sem
`data_fim` entram como "em andamento" pelo indicador. Escolha consciente de
confiar no fato (ausência de data) em vez do rótulo.

### Limpeza 2 — secretaria responsável

**O que o requisito pede.** Derivar a secretaria responsável "a partir do campo
`tipo`", definindo o critério e documentando o ambíguo.

**O que a exploração revelou.** `tipo` é uma chave ruim:

- **Ambíguo** — o mesmo `tipo` mistura secretarias (ex: `tipo = 3` tem
  "Fiscalização de estacionamento"/Transportes *e* "Reparo de luminária"/RioLuz).
- **Incompleto** — nulo em ~20% dos chamados (981k).

Já o `subtipo` é **preciso** e **nunca nulo** (0%).

**Critério adotado.** Classifico por **palavra-chave sobre `subtipo`**, em ordem de
prioridade (primeiro match vence). Refinei iterativamente medindo o `indefinido`:
17,6% → ... → **2,0%**. Resultado: **16 secretarias/órgãos**, ~98% classificado.

**Conclusão que contraria o enunciado.** A intenção era um híbrido `tipo`+`subtipo`,
mas o fallback por `tipo` ficou redundante (tipos monotemáticos já caem nas
keywords de `subtipo`; indefinidos têm `tipo` misto ou nulo). Classificar por
`subtipo` é estritamente melhor — o fallback seria *dead code*.

**Ambiguidades documentadas (default escolhido):** "resíduos de poda" → COMLURB
(coleta) antes de Parques; "roedores/caramujos" → Saúde (zoonoses); "Dívida Ativa"
→ Fazenda. O ~2% de `indefinido` é cauda longa honestamente não classificada
(escopo estadual/federal, cross-cutting, meta-1746) — forçar rótulo seria chutar.

## Tradeoffs e dívida técnica

| Decisão | Tradeoff | Como eu resolveria |
|---|---|---|
| **Mapa de secretaria como `CASE` com ~150 `LIKE`** na intermediate | Transparente e versionado, mas verboso e difícil de evoluir | Migrar para um `seed` CSV (`padrão → secretaria`) + macro dbt quando o mapa crescer |
| **Cache em memória no startup** (todos os chamados em Polars) | Simples e sem I/O por requisição, mas o processo segura o dataset inteiro e dados só atualizam com restart | Cota cabe em RAM hoje; ao crescer, voltar a consultar DuckDB sob demanda (ver Escalabilidade) ou recarregar via webhook pós-`dbt run` |
| **IdP mockado** (store de usuários + blacklist em memória) | Cumpre o fluxo OAuth2 end-to-end, mas usuários/tokens não persistem entre restarts | Trocar `mock_idp.py` por Keycloak (JWKS) — RBAC e routers não mudam; passo a passo no README do backend |
| **Refresh-token blacklist em memória** | Funciona single-instance; não escala horizontalmente | Mover para Redis com TTL = expiração do token |
| **Export sem streaming real** (CSV montado em `BytesIO`) | Ok para o volume filtrado típico; pode pesar em export irrestrito | Streamar em chunks ou delegar ao DuckDB `COPY` |
| **Sem testes no frontend** | Tempo priorizado em backend/pipeline (onde está a lógica de negócio) | Vitest + Testing Library nos hooks de dados e nos guards |
| **Rollup do dashboard na API** sobre o mart de grão fino `kpi_mensal_secretaria` | A API soma ~700 linhas pré-agregadas por request, em vez de só ler uma linha pronta (Opção B, um mart por janela) | Aceito: é rollup trivial, não varre o fato (~5M). Se quiser lookup puro, enumerar as ~900 janelas a partir do mesmo mart de grão fino |

## Padrões e boas práticas

**Nomenclatura dbt.** Modelos seguem `<prefixo>_<dataset>_<entidade>` no padrão
datario: `stg_` (raw), `int_` (intermediate), `fct_`/`dim_`/`mart_` (marts). Cada
modelo tem `.yml` par com descrição e testes (`not_null`, `unique`, etc.).

**Camadas com contrato claro.** `raw` = view, só tipa e normaliza texto;
`intermediate` = view, concentra limpeza e regra de negócio (encerramento,
secretaria, enriquecimento geo); `marts` = table com o fato consumível (`fct`), a
dimensão (`dim`) e o agregado de grão fino do dashboard (`mart_*_kpi_mensal_secretaria`).

**Agregação do dashboard: dbt vs API.** O princípio é não fazer agregação pesada
na API — varrer o fato (~5M linhas) por request. Mas o dashboard tem um slider de
janela de meses, e marts agregados sobre o período inteiro não servem a um recorte
arbitrário. A solução escolhida (**Opção A**): o dbt pré-agrega no **grão mais fino
que a tela fatia** — `(mês × secretaria)`, em `mart_*_kpi_mensal_secretaria`
(~700 linhas, medidas **aditivas**) — e a API faz um **rollup trivial** dessa
tabela para a janela escolhida. Métricas não-aditivas (tempo médio, taxa) não são
guardadas prontas: guardamos seus componentes (`soma_duracao_encerrados`,
contagens) e derivamos no rollup. A varredura dos ~5M chamados acontece uma vez no
dbt; a API só soma centenas de linhas.

Considerei pré-computar **todas as ~900 janelas** possíveis (`42×43/2`) num mart,
deixando a API com **lookup puro, zero soma** (a *letra* do princípio — **Opção
B**). Preferi a A porque: (1) o princípio existe para evitar varrer o fato, não
para proibir somar centenas de linhas já agregadas; (2) enumerar janelas só é
barato porque o grão é mensal e limitado — se o seletor virar diário (~1.250 dias
→ ~780k janelas) a B explode, enquanto grão fino + rollup escala; (3) menos
artefato e redundância. A B segue viável (construída a partir do mesmo mart de grão
fino) caso se queira lookup puro no futuro. Fronteira: **o dbt agrega (no grão
fino); a API só faz rollup de apresentação.**

**Backend.** Um router por recurso (`chamados`, `dashboard`, `tipos`, `users`,
`auth`); schemas Pydantic separados de routers; autenticação/autorização isoladas
em `auth/` (jwt, mock_idp, rbac). RBAC por dependency injection
(`require_role`, `_assert_can_manage`) — regra declarada no decorator, não espalhada.

**Estratégia de testes.** Foco no que tem regra de negócio: `test_rbac` (hierarquia
e *privilege escalation* — admin não promove a admin/super_admin), `test_auth`
(login, refresh com rotação, logout/revogação), `test_chamados` (filtros, paginação,
ordenação), `test_dashboard`. Os testes **não dependem do DuckDB**: o cache é
substituído por DataFrames mínimos via fixture, então rodam rápido e isolados.

**Frontend.** Estado de servidor via TanStack Query (cache, invalidação, filtros em
cascata); `lib/api/` (chamadas) separado de `lib/hooks/` (React Query) e de
componentes; guards de rota no `proxy.ts` (middleware) lendo cookie `session`.

**Automação.** `./install.sh`, `./test.sh` e `./start.sh` na raiz padronizam
setup/CI/run. `start.sh` roda a pipeline só se o DuckDB não existir (idempotente).

## Escalabilidade e manutenção

> como o sistema se comporta à medida que cresce, e o que mudaria com mais dados,
> mais usuários ou mais secretarias

**Mais dados.** O gargalo atual é o cache em memória do `fct` (usado por
`/chamados`): hoje o dataset filtrado (`data_particao >= 2023`) cabe em RAM e a
leitura por requisição é zero. Conforme cresce, o caminho é parar de carregar a
fato inteira e empurrar filtro/ordenação/paginação para o DuckDB via query
parametrizada (colunar, `LIMIT/OFFSET` eficiente). O dashboard já não é gargalo:
agrega o mart de grão fino (~700 linhas), não o fato. A pipeline escala bem: dbt +
DuckDB processam os 14M+ de chamados localmente. Hoje `fct` e os marts são `table`
(rebuild completo a cada `run`); o próximo passo é materialização `incremental` por
`data_particao` para não reprocessar todo o histórico.

**Mais usuários.** A API é stateless quanto a dados (read-only sobre cache), então
escala horizontalmente — exceto pela blacklist de refresh-token em memória, que
precisa ir para Redis para múltiplas instâncias. O IdP mockado vira Keycloak sem
tocar no RBAC.

**Mais secretarias.** É o ponto que mais vai mudar. O `CASE`/`LIKE` cresce
linearmente e fica frágil; a evolução natural é o `seed` CSV (`padrão → secretaria`)
+ macro, que transforma "adicionar secretaria" em editar uma planilha versionada em
vez de SQL. O `indefinido` (~2%) é o termômetro: subiu, é sinal de que o mapa precisa
de manutenção.
