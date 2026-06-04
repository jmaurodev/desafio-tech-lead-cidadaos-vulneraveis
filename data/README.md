# `data/` — arquivos de entrada da pipeline

Esta pasta guarda os dados **não versionados** (estão no `.gitignore`): os CSVs
exportados do BigQuery e o banco DuckDB gerado a partir deles. Só este README
sobe ao repositório.

Para reproduzir o projeto, coloque aqui os 5 CSVs abaixo (extraídos do
[dados.rio no BigQuery](https://console.cloud.google.com/bigquery)) e rode a carga:

```bash
cd pipeline
uv run python scripts/load_raw.py     # cria data/cidadaos_vulneraveis.duckdb
```

O `scripts/load_raw.py` usa `read_csv_auto`, então **colunas extras são ingeridas
sem problema** — o que importa é que as colunas **obrigatórias** abaixo existam
(são as que as camadas `stg_*` do dbt consomem). Os nomes dos arquivos precisam
bater exatamente.

---

## Arquivos esperados

| Arquivo | Tabela DuckDB | Origem (dataset BigQuery) |
|---|---|---|
| `chamado.csv` | `raw_chamados` | `adm_central_atendimento_1746` |
| `bairro.csv` | `raw_bairro` | `dados_mestres.bairro` |
| `area_planejamento.csv` | `raw_area_planejamento` | `dados_mestres` |
| `regiao_administrativa.csv` | `raw_regiao_administrativa` | `dados_mestres` |
| `subprefeitura.csv` | `raw_subprefeitura` | `dados_mestres` |

---

## Colunas obrigatórias por arquivo

### `chamado.csv`
| Coluna | Tipo | Observação |
|---|---|---|
| `id_chamado` | inteiro | Identificador único |
| `data_inicio` | timestamp | Abertura |
| `data_fim` | timestamp | Encerramento (nulo = em aberto). **Fonte da verdade de encerramento** |
| `data_alvo_finalizacao` | timestamp | Prazo SLA |
| `prazo_tipo` | texto | ex: `f` |
| `prazo_unidade` | texto | ex: `d` |
| `tipo` | inteiro | Código do tipo (nullable) |
| `subtipo` | texto | **Base do mapa de secretaria** (nunca nulo) |
| `status` | texto | Bruto |
| `situacao` | texto | Bruto |
| `longitude` | double | |
| `latitude` | double | |
| `data_particao` | date | A pipeline filtra `>= 2023-01-01` |
| `id_bairro` | inteiro | Join com `bairro.csv` (enriquecimento geo) |

### `bairro.csv`
| Coluna | Tipo |
|---|---|
| `id_bairro` | inteiro |
| `nome` | texto |
| `id_area_planejamento` | inteiro |
| `id_regiao_administrativa` | inteiro |
| `nome_regiao_administrativa` | texto |
| `subprefeitura` | texto |
| `geometry_wkt` | texto (WKT) |

### `area_planejamento.csv`
| Coluna | Tipo |
|---|---|
| `id_area_planejamento` | inteiro |
| `id_area_planejamento_numerico` | inteiro |
| `geometry_wkt` | texto (WKT) |

### `regiao_administrativa.csv`
| Coluna | Tipo |
|---|---|
| `id_regiao_administrativa` | inteiro |
| `nome` | texto |
| `id_area_planejamento` | inteiro |
| `id_area_planejamento_numerico` | inteiro |
| `geometry_wkt` | texto (WKT) |

### `subprefeitura.csv`
| Coluna | Tipo |
|---|---|
| `subprefeitura` | texto |
| `geometry_wkt` | texto (WKT) |

---

> As tipagens e normalizações (lowercase/trim) são aplicadas nas camadas `stg_*`
> do dbt; aqui os tipos são apenas o que se espera do CSV cru. Detalhes das
> decisões de modelagem e limpeza em [`../docs/decisoes.md`](../docs/decisoes.md).
