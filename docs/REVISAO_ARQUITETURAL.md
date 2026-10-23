# Revisão Arquitetural — Incluvia (foco em UX/UI e fluxo)

**Data:** 23/10/2026
**Escopo:** front-end (telas, navegação, acessibilidade, consistência visual), integração UI ↔ API e dados de demonstração.
**Objetivo:** tornar o MVP demonstrável de ponta a ponta, com fluxo claro, visual consistente e acessível, sem reconstruir o projeto.

---

## 1. Estado atual

| Item | Especificado em `arquitetura_paaa_solid.md` | Implementado |
| --- | --- | --- |
| Front-end | React + Vite + React Router | **Next.js 14 (App Router)**, páginas `'use client'` |
| Back-end | Express | **Route Handlers** do Next.js em `/api/v1` |
| Banco | PostgreSQL | **SQLite** via Prisma (`prisma/dev.db`) |
| Estilo | CSS Modules ou CSS por componente | CSS global (`globals.css`) + muitos `style={{…}}` inline |
| Auditoria | Playwright + axe-core em worker | Igual (`src/workers/audit-worker.ts`) |
| IA (fase posterior) | — | Rubrica local de capacitismo (`ai-bias-rubric.ts`) |
| Testes | Vitest | Vitest (4 arquivos, 28 testes) |

A divergência de stack (Next.js/SQLite no lugar de Vite/Express/PostgreSQL) é uma decisão já consolidada no código e no README. **Não será revertida**: o objetivo agora é UX/UI. Ela fica registrada aqui como desvio consciente da especificação.

Não há Vite no projeto (apenas Vitest, que usa Vite internamente para testes).

---

## 2. Problemas que impedem a demonstração (bloqueadores)

| # | Problema | Evidência | Efeito |
| --- | --- | --- | --- |
| B1 | Renomeação PAAA → Incluvia gerou e-mails com maiúscula (`auditor@Incluvia.local`) | `seed.ts`, `README.md`, `login/page.tsx` | `loginSchema` converte o e-mail para minúsculas → **as credenciais documentadas nunca autenticam**; 1 teste falha |
| B2 | Erro de sintaxe no seed (vírgula ausente) | `prisma/seed.ts:48` | `npm run db:seed` e `tsc` falham |
| B3 | `mode: 'insensitive'` em consultas Prisma | `findings/route.ts`, `projects/route.ts` | Não é suportado em SQLite → **a busca de achados retorna erro 500** |
| B4 | Tela de login lê `res.data.user`, mas `/auth/me` devolve `{ data: user }` | `login/page.tsx` | A aplicação nunca reconhece que o usuário já está conectado |
| B5 | `reviewFindingSchema.parse` lança `ZodError` não tratado | `findings/[id]/review` | Entrada inválida vira 500 em vez de 422 |
| B6 | Seed não cria execução nem achados | `seed.ts` | Sem o worker + Playwright rodando, a demo não mostra resultados, revisão nem relatório |
| B7 | `.env.example` aponta para PostgreSQL; `docker-compose.yml` sobe Postgres | raiz | Configuração morta e contraditória com o schema SQLite |
| B8 | `paginationSchema` recebe `null` para parâmetros ausentes; `z.coerce` converte em `0` e reprova | `projects/route.ts` | **`GET /projects` sempre falhava** — Painel e Projetos nunca listavam nada (encontrado na validação) |
| B9 | `npm run lint` sem configuração ESLint | raiz | O comando abre um prompt interativo em vez de validar o código |

---

## 3. Problemas de UX e fluxo de navegação

1. **Sem proteção de rotas na UI.** Sem sessão, o painel aparece "vazio" e só depois mostra "Autenticação necessária". O usuário não é levado ao login nem retorna à página de origem.
2. **Cabeçalho pouco informativo.** O link "Sessão" é ambíguo; não há indicação da página atual (`aria-current`), nome do usuário ou botão "Sair".
3. **Navegação contextual inconsistente.** Cada tela tem um "← Voltar…" diferente; a tela de auditoria tem um breadcrumb parcial. Falta hierarquia Projeto → Alvo → Auditoria.
4. **Painel não cumpre o mapa de telas (§6.2).** Faltam "auditorias recentes" e "continuar auditoria"; dois cartões de "estatística" são textos fixos ("WCAG + axe-core"), não dados. A tabela de projetos é duplicada da tela Projetos.
5. **Detalhe do projeto prioriza a extensão (IA) sobre o núcleo (web).** O botão primário é "Avaliar resposta de IA"; a seção de alvos web aparece depois. Há CTAs duplicados no cabeçalho e nas seções. Projeto arquivado não explica por que as ações sumiram.
6. **Resumo da auditoria enganoso.** Os contadores por severidade são calculados sobre a lista *filtrada e paginada*: ao filtrar, os totais mudam. A severidade "Leve" não aparece.
7. **Busca dispara uma requisição por tecla** e não há "Limpar filtros" nem anúncio do número de resultados.
8. **Execução na fila sem explicação.** Sem o worker em execução, a auditoria fica "Na fila" indefinidamente, sem indicação (contraria a regra 6 do documento de arquitetura: fluxos simulados devem ser sinalizados). Falta o tempo decorrido (§6.2, tela 7).
9. **Revisão de achados de IA** abre um formulário no fim da página, longe do botão clicado, sem mover o foco. A revisão de achados web usa outro padrão (modal). Dois comportamentos para a mesma tarefa.
10. **`alert()` e `confirm()` nativos** para arquivar, cancelar e erros de revisão — quebram o visual e não seguem o padrão `ConfirmDialog` sugerido (§6.4).
11. **Formulários:** erros do servidor (`details.fields`) são ignorados; não há erro junto ao campo (§6.5). Botões ficam desabilitados até o formulário "estar válido", sem explicar o motivo. O formulário de IA usa classes diferentes (`form-input` em `textarea`, checkbox sem estilo) e não tem "Cancelar".
12. **Títulos de aba idênticos** em todas as páginas ("Incluvia — Auditoria…"), o que prejudica histórico, abas e o anúncio de rota do Next.js para leitores de tela.

---

## 4. Problemas de acessibilidade (RNF-01 / WCAG 2.2 AA)

Pontos positivos já existentes: `lang="pt-BR"`, skip-link, `<main tabIndex={-1}>`, foco visível, `prefers-reduced-motion`, tabelas com `scope="col"`, badges com texto (não só cor).

| # | Problema | Critério WCAG |
| --- | --- | --- |
| A1 | `--text-muted` (#64748b) tem contraste 3,3–4,0:1 sobre os fundos; é usado em dicas, metadados e datas | 1.4.3 Contraste (mínimo) |
| A2 | Borda dos campos (#233149) tem 1,3:1 com o fundo — o campo é praticamente invisível | 1.4.11 Contraste não textual |
| A3 | Modais em `<div role="dialog">` sem foco inicial, sem armadilha de foco, sem `Esc` e sem devolver o foco | 2.1.2, 2.4.3 Ordem do foco |
| A4 | Campos obrigatórios marcados só com `*` `aria-hidden` (sem equivalente textual) e sem `aria-invalid`/erro associado | 3.3.1, 3.3.2, 4.1.2 |
| A5 | Emojis como indicadores (🔴, 👁️, 📥, ✏️, 🛡️) lidos literalmente por leitores de tela ("círculo vermelho") | 1.1.1 |
| A6 | Estados de carregamento e mudanças de resultado não são anunciados (`role="status"`/`aria-live`) | 4.1.3 Mensagens de status |
| A7 | Navegação principal sem `aria-current="page"` | 2.4.8 / boas práticas |
| A8 | Botões "Abrir", "Revisar", "Detalhes" repetidos sem contexto acessível | 2.4.4 Finalidade do link |
| A9 | Links externos `target="_blank"` sem aviso textual de nova aba | 3.2.5 (AAA, boa prática) |
| A10 | Cabeçalho em telas estreitas: marca + selo + 3 links não cabem; sem quebra | 1.4.10 Refluxo |

---

## 5. Qualidade do código (front-end)

- **Duplicação:** rótulos de severidade/revisão/estado repetidos em 4 telas (JSX condicional em uma, mapa em outra); padrão `loading/error/data + useEffect` repetido em 6 telas; tabela de projetos duplicada; modal de revisão duplicado (web e IA).
- **Estilo inline massivo** (`style={{…}}` em quase todos os elementos), dificultando consistência e responsividade.
- **`any` em todos os componentes** — sem tipos para os DTOs da API.
- **Dead code:** `api.getTargets`, `api.getTargetAudits` (não usados), `.user-badge` e `.nav-link.active` (CSS sem uso), `docker-compose.yml` (Postgres não usado).
- **`fetch` direto** na tela de auditoria (prévia do relatório), contrariando §13.2.
- **Avisos de `useEffect`** com dependências ausentes (funções declaradas após o efeito).

---

## 6. Melhorias propostas (priorizadas)

### P1 — Fluxo e bloqueadores
1. Corrigir B1–B9 (e-mails minúsculos, seed válido, busca compatível com SQLite, `/auth/me`, `ZodError` → 422, `.env.example`, remover `docker-compose.yml`).
2. **Seed demonstrativo:** projeto piloto com alvo, uma execução concluída com achados realistas (parte já revisada) e uma avaliação de IA gerada pela rubrica real. Os dados ficam identificados como demonstrativos no campo "Motor".
3. **Proteção de rotas:** `middleware.ts` redireciona para `/login?next=…` quando não há cookie de sessão; o cliente HTTP trata `401` do mesmo modo (cookie expirado). A API continua sendo a autoridade.
4. **Cabeçalho (`AppHeader`):** página atual destacada (`aria-current`), usuário conectado e botão "Sair"; oculta a navegação na tela de login.
5. **Breadcrumbs** consistentes: Projetos › Projeto › Alvo › Auditoria / Avaliação de IA.
6. **Painel:** indicadores reais (projetos ativos, alvos, auditorias, avaliações de IA), "Auditorias recentes" com ação "Continuar", e um guia curto do fluxo (Projeto → Alvo → Auditoria → Revisão → Relatório) para orientar a apresentação.
7. **Detalhe do projeto:** alvos web primeiro (núcleo do MVP), IA depois; CTAs únicos por seção; aviso de somente leitura para projeto arquivado; arquivamento via `ConfirmDialog`.
8. **Auditoria:** resumo calculado no servidor (não afetado por filtros), incluindo "Leve"; busca com *debounce*; "Limpar filtros"; contagem anunciada; aviso explícito quando a execução depende do worker; tempo decorrido; cancelamento via `ConfirmDialog`.
9. **Revisão de achados unificada** (`ReviewDialog`) para achados web e de IA.

### P2 — Consistência visual e responsividade
10. Componentes de UI mínimos e reutilizados: `PageHeader`, `Breadcrumbs`, `Modal` (baseado em `<dialog>` nativo), `ConfirmDialog`, `StatusBadge`, `LoadingState`, `ErrorState`, `EmptyState`, `Field`.
11. Substituir estilos inline por classes utilitárias no `globals.css`; ajustar tokens de cor para contraste AA; botões primários sólidos; cabeçalho e tabelas responsivos.

### P3 — Qualidade do código
12. `labels.ts` como fonte única de rótulos; `types.ts` com DTOs usados pela UI; hook `useResource` para carregamento/erro/recarga.
13. Remover dead code e mover a prévia do relatório para o `api-client`.

### Fora do escopo desta revisão (deliberadamente)
- Migrar para Vite/Express/PostgreSQL.
- Edição de projeto (PATCH existe na API, mas não é necessário para a demo).
- Testes E2E com Playwright da própria interface e paginação de achados na UI (a API já pagina em 50).
- Tela de administração de usuários.
