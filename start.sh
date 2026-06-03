#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DUCKDB_FILE="$SCRIPT_DIR/data/cidadaos_vulneraveis.duckdb"

GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
RED=$'\033[0;31m'
BOLD=$'\033[1m'
NC=$'\033[0m'

log_info()  { echo "${GREEN}[start]${NC} $1"; }
log_warn()  { echo "${YELLOW}[start]${NC} $1"; }
log_error() { echo "${RED}[start]${NC} $1" >&2; }

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  log_info "Encerrando aplicações..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  log_info "Encerrado."
}
trap cleanup INT TERM

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    log_warn "Porta $port já em uso. Encerrando processo existente..."
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 1
  fi
}

# Limpa portas antes de subir para evitar conflitos
kill_port 8000
kill_port 3000

# VIRTUAL_ENV herdado do shell pode causar aviso no uv/pnpm
unset VIRTUAL_ENV 2>/dev/null || true

# --- Pipeline ---
if [ ! -f "$DUCKDB_FILE" ]; then
  log_warn "DuckDB não encontrado. Executando pipeline pela primeira vez (pode demorar alguns minutos)..."

  cd "$SCRIPT_DIR/pipeline"

  log_info "[pipeline] Carregando CSVs no DuckDB..."
  uv run python scripts/load_raw.py

  log_info "[pipeline] Executando transformações dbt..."
  uv run dbt run

  log_info "[pipeline] DuckDB gerado em data/cidadaos_vulneraveis.duckdb"
else
  log_info "DuckDB encontrado. Pulando pipeline."
fi

# --- Backend ---
log_info "Iniciando backend (FastAPI na porta 8000)..."
cd "$SCRIPT_DIR/backend"
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

log_info "Aguardando backend ficar pronto..."
BACKEND_READY=0
for i in $(seq 1 60); do
  if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    BACKEND_READY=1
    break
  fi
  sleep 1
done

if [ "$BACKEND_READY" -eq 0 ]; then
  log_error "Backend não respondeu em 60s. Verifique os logs acima."
  cleanup
  exit 1
fi
log_info "Backend pronto."

# --- Frontend ---
log_info "Iniciando frontend (Next.js na porta 3000)..."
cd "$SCRIPT_DIR/frontend"
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "${BOLD}Aplicações em execução:${NC}"
echo "  Backend  → http://localhost:8000"
echo "  API Docs → http://localhost:8000/docs"
echo "  Frontend → http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para encerrar."

wait
