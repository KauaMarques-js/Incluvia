# Incluvia — Plataforma de Auditoria e Acessibilidade Algorítmica

Aplicação web completa para organizar, executar e documentar auditorias de acessibilidade digital e mitigar riscos de capacitismo algorítmico em conformidade com as diretrizes **WCAG 2.2 Nível AA**.

Desenvolvida com **Next.js (App Router)**, **TypeScript**, **Vanilla CSS**, **Prisma ORM**, **SQLite (100% offline e local)**, **Playwright** e **axe-core**.

---

## 🚀 Requisitos e Pré-requisitos

- **Node.js**: v20+ ou v22+ ou v23+ (nenhum serviço externo ou Docker é obrigatório).

---

## 🛠️ Instalação e Configuração

### 1. Clonar e Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

O arquivo `.env` já vem pré-configurado para SQLite local:

```bash
DATABASE_URL="file:./dev.db"
```

### 3. Sincronizar o Banco de Dados e Executar Seed

```bash
# Cria e sincroniza o banco SQLite local dev.db
npm run db:push

# Executa o seed com usuários e projeto demonstrativo piloto
npm run db:seed
```

O seed cria um projeto piloto com um alvo, **uma auditoria concluída com 8 achados ilustrativos** (parte já revisada) e **uma avaliação de IA** gerada pela rubrica real. Assim, o fluxo completo (resultados → revisão → relatório) pode ser demonstrado sem executar o worker. Esses dados aparecem com o motor identificado como “dados de demonstração (seed)”.

#### Credenciais Padrão Criadas pelo Seed:

- **Auditor:**
  - E-mail: `auditor@incluvia.local`
  - Senha: `Auditor@123456`
- **Administrador:**
  - E-mail: `admin@incluvia.local`
  - Senha: `Admin@123456`

---

## 💻 Execução da Aplicação

### Interface Web (Next.js)

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### Worker de Auditoria (Processamento Assíncrono)

Em um terminal separado:

```bash
npm run worker
```

O worker monitora execuções no SQLite local e roda Playwright + axe-core. Em paralelo, cada projeto aceita avaliação de respostas de IA com rubrica local de capacitismo (sem chamar provedor externo).

---

## 🧪 Testes Automatizados

A suíte de testes utiliza o **Vitest** e cobre proteções críticas contra SSRF, validação de schemas Zod, a rubrica de IA e o gerador de relatórios Markdown:

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Lint (next/core-web-vitals)
npm run lint
```

---

## 🏛️ Arquitetura e Estrutura do Projeto

```text
src/
├── app/
│   ├── api/v1/                 # Endpoints REST versionados
│   │   ├── auth/               # Login, logout e me (iron-session)
│   │   ├── projects/           # CRUD e arquivamento de projetos
│   │   ├── targets/            # Alvos e início de auditorias (202 Accepted)
│   │   ├── audits/             # Consulta, cancelamento, achados e relatório .md
│   │   └── findings/           # Detalhes e revisão humana de achados
│   ├── projects/               # Telas de listagem, criação e detalhes de projeto
│   ├── targets/                # Telas de detalhes e histórico de alvos
│   ├── audits/                 # Tela de resultados, filtros, revisão humana e exportação
│   ├── login/                  # Tela de login acessível
│   ├── layout.tsx              # Root layout com skip-link, AppHeader e rodapé
│   ├── globals.css             # Design system WCAG 2.2 AA (tokens com contraste verificado, motion-safe)
│   └── page.tsx                # Painel (indicadores, auditorias recentes, projetos, fluxo)
├── components/                 # UI reutilizada: AppHeader, PageHeader/Breadcrumbs, Modal/ConfirmDialog,
│                               # ReviewDialog, FindingCard, Field, Badges, States, ProjectsTable
├── middleware.ts               # Redireciona visitantes sem sessão para /login?next=… (a API segue como autoridade)
├── lib/
│   ├── api-client.ts           # Cliente HTTP centralizado e tipado para a UI (trata 401 e erros por campo)
│   ├── labels.ts               # Rótulos pt-BR de severidade, revisão e estado + formatação
│   ├── types.ts                # DTOs da API consumidos pela interface
│   ├── use-resource.ts         # Hook de carregamento/erro/recarga e debounce
│   ├── audit-engine.ts         # Motor Playwright + axe-core com crawler seguro
│   ├── config.ts               # Configurações de ambiente
│   ├── errors.ts               # Tratamento padronizado de erros de API
│   ├── password.ts             # Hashing com Argon2id
│   ├── prisma.ts               # Cliente singleton do Prisma
│   ├── report-generator.ts     # Gerador de relatório Markdown (RF-08)
│   ├── schemas.ts              # Schemas Zod de validação
│   ├── session.ts              # Sessões seguras via cookies HttpOnly
│   └── url-validator.ts        # Validador de URL e proteção robusta anti-SSRF
├── workers/
│   └── audit-worker.ts         # Processo de background para execução de auditorias
prisma/
│   ├── schema.prisma           # Schema relacional (User, Project, AuditTarget, AuditRun, Finding)
│   └── seed.ts                 # Script de seed inicial
tests/
│   ├── report-generator.test.ts # Testes do gerador de relatórios
│   ├── schemas.test.ts          # Testes dos schemas Zod
│   └── url-validator.test.ts    # Testes de segurança anti-SSRF
```

---

## 🛡️ Diretrizes Éticas e Metodológicas

- **Acessibilidade não é apenas automação:** Testes automatizados identificam tipicamente entre 30% e 50% das barreiras potenciais. A ausência de erros automatizados **não certifica** conformidade plena.
- **VLibras:** o widget oficial do Governo Federal (tradução para Libras) é carregado no layout raiz a partir de `vlibras.gov.br` (`src/components/VLibrasWidget.tsx`). Requer internet; ele complementa, mas não substitui, a acessibilidade da interface.
- **Acessibilidade da própria interface:** as telas principais são verificadas com axe-core (WCAG 2.2 A/AA), têm navegação por teclado, foco visível, diálogos nativos (`<dialog>`) e contraste mínimo de 4,5:1 para texto. Ver `docs/REVISAO_ARQUITETURAL.md`.
- **Validação Humana Essencial:** Todo achado na Incluvia possui fluxo de revisão humana (`confirmed`, `false_positive`, `needs_context`, `fixed`).
- **Segurança Proativa (Anti-SSRF):** Bloqueio estrito de IPs privados (RFC 1918), loopback, link-local e metadados de nuvem tanto na criação do alvo quanto em cada página e redirecionamento.
