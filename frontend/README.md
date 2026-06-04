# Frontend — Chamados 1746

Next.js 16 (App Router) + TypeScript + TailwindCSS v4 + shadcn/ui.

## Pré-requisitos

- Node.js 18+
- pnpm 8+
- Backend rodando em `http://localhost:8000` (ver `../backend/README.md`)

## Instalação

```bash
pnpm install
```

## Executar em desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Usuários de teste

| Usuário       | Senha         | Role        |
|---------------|---------------|-------------|
| `operador1`   | `operador123` | Operador    |
| `admin1`      | `admin123`    | Admin       |
| `superadmin`  | `super123`    | Super Admin |

## Estrutura

```
src/
├── app/
│   ├── (auth)/login/         # Página de login
│   └── (dashboard)/          # Shell autenticado
│       ├── dashboard/        # KPIs + gráficos
│       ├── chamados/         # Listagem + filtros + exportação
│       └── admin/            # Gestão de usuários (admin+)
├── components/
│   ├── auth/                 # LoginForm
│   ├── dashboard/            # KpiGrid, MonthlyChart, SecretariaChart
│   ├── chamados/             # ChamadosTable, ChamadosFilters, ExportButton
│   ├── admin/                # UsersTable, CreateUserDialog, RoleUpdateDialog
│   └── shared/               # AppShell, LoadingSpinner, Providers
├── lib/
│   ├── api-client.ts         # fetch wrapper com auto-refresh JWT
│   ├── api/                  # Funções por endpoint
│   ├── auth/                 # token-store + AuthContext
│   └── hooks/                # React Query hooks
└── types/api.ts              # Interfaces TypeScript do backend
```

## Variáveis de ambiente

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Build de produção

```bash
pnpm build && pnpm start
```
