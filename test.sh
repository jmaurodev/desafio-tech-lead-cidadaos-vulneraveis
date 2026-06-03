#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DUCKDB_FILE="$SCRIPT_DIR/data/cidadaos_vulneraveis.duckdb"

GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
RED=$'\033[0;31m'
BOLD=$'\033[1m'
NC=$'\033[0m'

log_section() { echo ""; echo "${BOLD}=== $1 ===${NC}"; }
log_ok()      { echo "${GREEN}[ok]${NC} $1"; }
log_warn()    { echo "${YELLOW}[aviso]${NC} $1"; }
log_error()   { echo "${RED}[erro]${NC} $1" >&2; }

FAILED=0

# --- Backend ---
log_section "Backend — pytest"
cd "$SCRIPT_DIR/backend"
if uv run pytest -v; then
  log_ok "Backend: todos os testes passaram."
else
  log_error "Backend: testes falharam."
  FAILED=1
fi

# --- Frontend ---
log_section "Frontend — TypeScript"
cd "$SCRIPT_DIR/frontend"
if pnpm exec tsc --noEmit; then
  log_ok "Frontend: type check sem erros."
else
  log_error "Frontend: erros de tipo encontrados."
  FAILED=1
fi

# --- Pipeline ---
log_section "Pipeline — dbt test"
if [ -f "$DUCKDB_FILE" ]; then
  cd "$SCRIPT_DIR/pipeline"
  if uv run dbt run && uv run dbt test; then
    log_ok "Pipeline: testes dbt passaram."
  else
    log_error "Pipeline: testes dbt falharam."
    FAILED=1
  fi
else
  log_warn "DuckDB não encontrado em data/cidadaos_vulneraveis.duckdb."
  log_warn "Execute ./start.sh primeiro para gerar os dados e então rode ./test.sh novamente."
fi

# --- Resultado ---
echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "${GREEN}${BOLD}Todos os testes passaram!${NC}"
  exit 0
else
  echo "${RED}${BOLD}Alguns testes falharam. Verifique a saída acima.${NC}"
  exit 1
fi
