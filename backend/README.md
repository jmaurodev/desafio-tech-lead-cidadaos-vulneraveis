# Backend — Chamados 1746 API

FastAPI + Polars + DuckDB. Lê os marts pré-agregados pelo pipeline dbt e os carrega em memória no startup — nenhum I/O por requisição.

## Pré-requisitos

- Python 3.11+
- [uv](https://github.com/astral-sh/uv)
- Pipeline dbt executado ao menos uma vez (`data/cidadaos_vulneraveis.duckdb` existente)

## Instalação

```bash
cd backend
uv sync
```

## Executar

```bash
cd backend
uv run uvicorn api.main:app --reload
```

API disponível em `http://localhost:8000`.  
Documentação interativa: `http://localhost:8000/docs`

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `API_DUCKDB_PATH` | `../data/cidadaos_vulneraveis.duckdb` | Caminho para o banco DuckDB |
| `API_JWT_SECRET` | (valor de dev) | Secret para assinar JWTs — **obrigatório trocar em produção** |
| `API_ACCESS_TOKEN_TTL_MINUTES` | `15` | TTL do access token |
| `API_REFRESH_TOKEN_TTL_DAYS` | `7` | TTL do refresh token |

Crie um `.env` na raiz do `backend/` para sobrescrever os defaults.

## Testes

```bash
cd backend
uv run pytest -v
```

Os testes **não dependem do DuckDB** — o cache é substituído por DataFrames mínimos via fixture.

## Endpoints

### Auth

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/auth/token` | Login (OAuth2 password flow). Retorna `access_token` + `refresh_token` |
| `POST` | `/auth/refresh` | Rotaciona tokens. O refresh token antigo é invalidado imediatamente |
| `POST` | `/auth/logout` | Revoga o refresh token |

**Usuários de seed (mock):**

| Username | Senha | Role |
|---|---|---|
| `operador1` | `operador123` | operador |
| `admin1` | `admin123` | admin |
| `superadmin` | `super123` | super_admin |

### Chamados

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/chamados` | Lista paginada com filtros, busca e ordenação |
| `GET` | `/chamados/{id}` | Detalhe de um chamado |
| `GET` | `/chamados/export` | Exporta resultado filtrado como CSV |

**Parâmetros de `/chamados`:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `tipo` | string | Filtra pelo código de tipo |
| `subtipo` | string | Filtra pelo subtipo |
| `secretaria` | string | Filtra pela secretaria responsável |
| `status` | string | Filtra pelo status |
| `situacao` | string | `encerrado` ou `não encerrado` |
| `ano_mes` | string | Formato `YYYY-MM` |
| `q` | string | Busca livre em `id_chamado` e `subtipo` |
| `sort_by` | string | Campo de ordenação (default: `data_inicio`) |
| `sort_desc` | bool | Decrescente (default: `true`) |
| `page` | int | Página (default: `1`) |
| `page_size` | int | Itens por página — máx 500 (default: `50`) |

### Dashboard

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/dashboard` | KPIs gerais + série mensal + breakdown por secretaria |

Os dados vêm de tabelas mart pré-agregadas pelo dbt (`mart_kpi_geral`, `mart_kpi_mensal`, `mart_kpi_secretaria`) e são servidos direto do cache — sem recálculo.

### Tipos

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/tipos` | Mapa `tipo → [subtipos]` para filtros em cascata no frontend |

### Usuários (RBAC)

| Método | Path | Role mínimo | Descrição |
|---|---|---|---|
| `GET` | `/users` | admin | Lista usuários |
| `POST` | `/users` | admin | Cria usuário (role ≤ próprio) |
| `PUT` | `/users/{id}/role` | admin | Altera role (role-alvo ≤ próprio, role-atual-do-target < próprio) |
| `DELETE` | `/users/{id}` | admin | Remove usuário (role < próprio) |

## Autenticação

Fluxo OAuth 2.0 Password Grant mockado com PyJWT:

```
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=operador1&password=operador123
```

Use o `access_token` retornado no header `Authorization: Bearer <token>`.

### Integração com Keycloak (produção)

Substitua `api/auth/mock_idp.py` por validação de tokens emitidos pelo Keycloak:

1. Configure `KEYCLOAK_URL`, `REALM` e `CLIENT_ID`
2. Busque o JWKS em `{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/certs`
3. Valide o JWT com `jwt.decode(..., jwks_client.get_signing_key_from_jwt(token).key)`
4. Extraia `role` do claim `realm_access.roles` ou de um claim customizado

O restante da API (RBAC, routers) não muda — apenas o ponto de validação de token.

## Arquitetura

```
api/
├── main.py          # FastAPI app + lifespan (carrega cache no startup)
├── config.py        # Settings via pydantic-settings
├── database.py      # Conexão DuckDB (só usada no startup)
├── cache.py         # DataFrames polars em memória
├── auth/
│   ├── jwt.py       # Encode/decode JWT
│   ├── mock_idp.py  # Store de usuários + blacklist de tokens
│   └── rbac.py      # Dependências de autenticação e autorização
├── routers/         # Um arquivo por recurso
└── schemas/         # Modelos Pydantic de request/response
```
