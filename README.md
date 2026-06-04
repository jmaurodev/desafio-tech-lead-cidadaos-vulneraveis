# Desafio Técnico - Tech Lead
## Programa Pequenos Cariocas (PIC)

---

## Como Rodar

### Pré-requisitos

| Ferramenta | Versão mínima | Instalação |
|-----------|---------------|------------|
| [uv](https://docs.astral.sh/uv/) | 0.4+ | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| [pnpm](https://pnpm.io/) | 8+ | `npm install -g pnpm` |
| Python | 3.11+ | via uv (automático) |
| Node.js | 18+ | via pnpm (automático) |

Os arquivos de dados brutos (CSV) devem estar em `data/` antes da primeira execução.

### Passo a passo

**1. Instalar dependências** (apenas na primeira vez após clonar o repositório)

```bash
./install.sh
```

Instala as dependências Python de pipeline e backend via `uv`, e as dependências Node do frontend via `pnpm`.

---

**2. Executar os testes**

```bash
./test.sh
```

Roda `pytest` no backend, `tsc --noEmit` no frontend e `dbt test` na pipeline (se o DuckDB já existir). Retorna código de saída 1 se qualquer suite falhar.

---

**3. Iniciar as aplicações**

```bash
./start.sh
```

- Se `data/cidadaos_vulneraveis.duckdb` **não existir**: executa a pipeline completa (carrega os CSVs e roda os modelos dbt) antes de subir os serviços.
- Se o arquivo **já existir**: pula a pipeline e sobe direto.

Após iniciado:

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| Swagger (API docs) | http://localhost:8000/docs |

Pressione `Ctrl+C` para encerrar todos os processos.