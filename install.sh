#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
RED=$'\033[0;31m'
BOLD=$'\033[1m'
NC=$'\033[0m'

log_info()  { echo "${GREEN}[install]${NC} $1"; }
log_warn()  { echo "${YELLOW}[install]${NC} $1"; }
log_error() { echo "${RED}[install]${NC} $1" >&2; }

check_command() {
  if ! command -v "$1" &>/dev/null; then
    log_error "Pré-requisito ausente: '$1'"
    log_error "Instale '$1' e tente novamente."
    exit 1
  fi
}

echo "${BOLD}Verificando pré-requisitos...${NC}"
check_command uv
check_command pnpm
check_command python3
log_info "Pré-requisitos ok."

echo ""
log_info "Instalando dependências da pipeline..."
cd "$SCRIPT_DIR/pipeline"
uv sync

echo ""
log_info "Instalando dependências do backend..."
cd "$SCRIPT_DIR/backend"
uv sync

echo ""
log_info "Instalando dependências do frontend..."
cd "$SCRIPT_DIR/frontend"
pnpm install --frozen-lockfile

echo ""
echo "${GREEN}${BOLD}Instalação concluída!${NC}"
echo ""
echo "  Próximos passos:"
echo "    1. ./test.sh    — executar os testes"
echo "    2. ./start.sh   — iniciar as aplicações"
echo ""
