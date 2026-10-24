# Changelog Arquitetural — Incluvia

Registro das alterações feitas a partir de `docs/REVISAO_ARQUITETURAL.md`.
Foco: UX/UI, fluxo de navegação, acessibilidade e organização do front-end. A stack (Next.js 14 + Prisma/SQLite) e a API REST foram preservadas.

---

## 2026-10-23 (3) — Avaliação de IA: comparação pareada, repetições, Claude e evolução

Objetivo: transformar a avaliação de IA de "procurar palavras numa resposta" em um método com evidência mais forte, seguindo o Módulo C do dossiê ("casos equivalentes que variam somente o aspecto sob avaliação"). A revisão humana continua sendo a decisão final.

### 1. O que mudou para o usuário

| Ideia | Implementação |
| --- | --- |
| Comparação pareada | Cada cenário tem uma **pergunta de referência** que muda só a menção à deficiência (no cenário interseccional, gênero e raça ficam nas duas). Em cenários de decisão, cada resposta recebe um desfecho (favorável, desfavorável ou sem decisão clara). Se a versão com deficiência recebe desfecho pior, surge o achado **Tratamento desigual na decisão**, mesmo sem nenhuma palavra ofensiva. |
| Repetições | De 1 a 5 respostas por pergunta. Cada achado informa **"em X de N respostas"** e quantas vezes o mesmo padrão apareceu na referência. |
| Execução automática | Origem das respostas: **coladas** (qualquer sistema), **geradas pelo Claude** (SDK oficial `@anthropic-ai/sdk`, modelo `claude-opus-5-5`, com `fallbacks: "default"`) ou **simulador de demonstração** (texto pré-escrito, sempre identificado como tal). Sem `ANTHROPIC_API_KEY`, as opções do Claude aparecem desabilitadas com a explicação. |
| Auditoria contínua | **Repetir avaliação** refaz as mesmas perguntas (nova versão do modelo, nova data). A tela de resultado mostra a **Evolução** em relação à avaliação anterior do mesmo cenário. |
| Rubrica mais inteligente | **Segunda opinião** opcional: o Claude lê cada resposta com as mesmas categorias (saída estruturada em JSON Schema). Os achados aparecem como "Segunda opinião (IA)", nunca como veredito. **Histórico da regra**: as revisões humanas (confirmado × falso positivo) medem a precisão de cada regra. |
| Cenários com PCD | **Biblioteca** (`/ai-library`) com 8 cenários + livre, contexto, deficiência, interseccionalidade e status de validação. Todos aparecem como "validação com consultores PCD pendente": nenhuma validação foi inventada. |
| Como corrigir | Cada achado traz **exemplo de reescrita**; a avaliação reúne **instruções sugeridas para o prompt de sistema** do produto avaliado, a partir dos achados não descartados. |

### 2. Arquitetura

- `src/lib/ai-scenarios.ts`: biblioteca de cenários (pergunta, referência, decisão, deficiências, interseccionalidade, validação).
- `src/lib/ai-bias-rubric.ts`: motor puro: regras explicáveis, frequência, classificação de desfecho, comparação pareada, orientação de correção.
- `src/lib/ai-simulator.ts`: respostas pré-escritas por cenário (as primeiras mais enviesadas, para simular "versões").
- `src/lib/claude.ts`: único ponto de acesso à API do Claude (credencial só no servidor; tratamento de `refusal`).
- `src/lib/ai-judge.ts`: segunda opinião e agregação por categoria.
- `src/lib/ai-evaluation-service.ts`: orquestra respostas → rubrica → segunda opinião; sem acesso a banco, usado pela rota e pelo seed.
- `src/lib/ai-rule-stats.ts`: histórico de revisões por regra.
- Dados: `AiEvaluation` ganhou `mode`, `source`, `referencePrompt` e `judgeStatus`; nova tabela `AiResponse` (variante, posição, texto, desfecho); `AiFinding` ganhou `source`, `occurrences`, `samples` e `referenceOccurrences`. O campo `responseText` foi removido (as respostas agora são linhas de `AiResponse`).
- API: `POST /projects/:id/ai-evaluations` (novo contrato, validação Zod com regras cruzadas); `GET /ai-evaluations/:id` (com orientação, histórico, instruções e avaliação anterior); `GET /ai-catalog` substitui `GET /ai-scenarios`.
- Interface: novo formulário em 4 passos (Cenário, Perguntas, Respostas, Confirmação), resultado com comparação de desfechos, evolução, achados, correção e respostas lado a lado, mais a página Biblioteca.
- Relatório Markdown: método, origem, comparação, frequência, origem do achado, exemplo, instruções e respostas analisadas.
- Seed: duas avaliações do simulador no mesmo cenário (uma semana de distância, "versões" 2026-09 e 2026-10; a antiga já revisada), mostrando evolução de 4 para 1 achado. A versão nova ainda tem 1 de 3 respostas desfavoráveis sem nenhuma palavra suspeita: só a comparação pareada a encontra.
- Correção: o login e o logout usam navegação completa. No `next start`, o cache do roteador reaproveitava o redirecionamento para `/login` feito antes de entrar, e o login não saía da tela (encontrado ao gravar o vídeo de pitch).

### 3. Validações executadas

| Validação | Resultado |
| --- | --- |
| `npx tsc --noEmit` | sem erros |
| `npm run lint` | sem avisos |
| `npm test` | **42/42** (17 da avaliação de IA: frequência, referência, desfecho, tratamento desigual, simulador, segunda opinião, validação, relatório) |
| `npm run build` | concluído |
| axe-core (WCAG 2.2 A/AA) em 12 telas, incluindo formulário, duas avaliações e biblioteca, mais o diálogo de revisão | **0 violações** |
| Fluxo no navegador (produção) | resultado do seed (comparação, evolução 4 → 1, histórico da regra, instruções); "Repetir avaliação" com o simulador |
| API | colar respostas pareadas → segregação, estereótipo e tratamento desigual (1 de 2, referência 0); referência ausente → 422 com erro no campo; Claude sem chave → 409 com explicação |
| 375 px | formulário, resultado e biblioteca sem rolagem horizontal |

**Não testado:** a geração e a segunda opinião com o Claude de verdade (não há `ANTHROPIC_API_KEY` neste ambiente). O código segue a documentação oficial do SDK e compila contra os tipos do pacote instalado.

### 4. Limitações

- A classificação de desfecho usa expressões em português ("é apto", "não recomendo", "negado"). Respostas ambíguas viram "sem decisão clara" e não entram na comparação.
- O simulador produz sempre as mesmas respostas para o mesmo deslocamento; ele serve para demonstração, não para medir viés.
- O vídeo de pitch (`pitch/`) mostra o formulário antigo de IA e precisa ser regravado.

---

## 2026-10-23 (2) — Refinamento visual sóbrio e integração do VLibras

Objetivo: eliminar a aparência genérica (gradientes, brilhos, cartões arredondados para tudo, animações) e dar à Incluvia a cara de uma ferramenta profissional de auditoria, mantendo o tema escuro, o nome e o propósito. Nenhuma dependência npm foi adicionada.

### 1. Direção visual (`src/app/globals.css`)

| Antes | Depois |
| --- | --- |
| Azul-marinho saturado, acento ciano "neon", selo roxo em pílula | Grafite neutro (`#0f1216`/`#161a20`), um único acento azul (`#5ab0f0`), cores sólidas |
| Raios de 6–16 px, sombras, `backdrop-filter`, badges em pílula | Raio de 4 px (2 px em badges/código), sem sombras nem desfoque |
| Cartões com borda colorida para cada indicador | **Faixa de indicadores** (`.stat-strip`): números lado a lado com divisórias; severidade marcada por um pequeno quadrado + rótulo |
| Cada achado em um cartão separado com borda lateral colorida | **Lista de achados** (`.issue-list`): linhas separadas por divisórias, como em rastreadores de issues |
| Formulários dentro de cartões | Formulário direto na página; caixa (`.panel`) só no login |
| "Como funciona" em 5 cartões | Lista numerada simples (`.steps`) |
| Spinner animado, transições em botões, alerta com fundo colorido | Texto de status (`role="status"`); sem transições; alerta com barra lateral de 3 px e fundo neutro |
| Estado vazio com borda tracejada centralizada | Bloco alinhado à esquerda com borda sólida discreta |
| Badges preenchidas | Badges contornadas (texto + borda na cor do estado) |

- Contrastes verificados: texto ≥ 5,1:1 em todos os fundos; bordas de controles ≥ 3:1; botão primário 8:1.
- Cabeçalho de página separado do conteúdo por divisória; trilha com `/`; números com `tabular-nums`.
- `scroll-padding-top` para o cabeçalho fixo não encobrir o elemento focado (WCAG 2.4.11).
- Nenhuma animação própria; a regra de `prefers-reduced-motion` permanece como salvaguarda.
- Todos os `style={{…}}` restantes foram removidos (`.login-wrapper`, `.btn-block`, `.filters-2`, `.dialog-context`).

### 2. Páginas e componentes ajustados

- **Layout/cabeçalho** (`layout.tsx`, `AppHeader`): marca + descrição em texto (sem selo), aba ativa sublinhada, rodapé alinhado ao conteúdo, espaço reservado à direita para o VLibras.
- **Login**: painel simples, demonstração separada por divisória.
- **Painel** (`/`): faixa de indicadores, tabela de auditorias recentes (ação "Continuar revisão", "Acompanhar" ou "Ver detalhes" conforme o estado), passos do fluxo em lista.
- **Projetos**, **Projeto**, **Alvo**: tabelas e estados vazios no novo estilo; diálogos com cabeçalho/rodapé separados por divisórias.
- **Novo projeto**, **Novo alvo**, **Nova avaliação de IA**: formulários sem caixa.
- **Auditoria**: resumo em faixa com marcadores de severidade, achados em lista com divisórias.
- **Avaliação de IA**: prompt e resposta como blocos de citação (`.text-block`) com títulos, achados em lista.
- Componentes: `States` (sem spinner), `FindingCard` (linha de lista), `Modal` (cabeçalho/rodapé com divisórias), `ReviewDialog` (opções agrupadas numa só caixa).
- `api/v1/ai-scenarios`: `dynamic = 'force-dynamic'`, como as demais rotas sem parâmetros (removia um erro de pré-renderização no log do build).

### 3. VLibras (`src/components/VLibrasWidget.tsx`)

Integração oficial, conforme a [documentação do VLibras Widget 7](https://vlibras.gov.br/doc/widget/installation/webpageintegration.html) referenciada em gov.br/governodigital:

- O script `https://vlibras.gov.br/app/vlibras-plugin.js` é carregado com `next/script` (`strategy="afterInteractive"`, `id` fixo) **uma única vez**, no layout raiz. O `next/script` não reinjeta o mesmo `src` na navegação do App Router, e o plugin ignora inicializações repetidas.
- Em `onReady`, chama `new window.VLibras.Widget({ rootPath: 'https://vlibras.gov.br/app', position: 'R' })`, a forma documentada de configurar o widget.
- **Posicionamento:** por padrão o botão fica fixo no meio da borda direita e, no celular, encobre botões como "Revisar". O componente move o elemento exposto pelo plugin (`window.VLibrasWidget.access`) para um **espaço reservado no canto do cabeçalho**. O espaço é definido por variáveis CSS (`--vlibras-slot`, `--vlibras-top`, `--vlibras-right`) e ajustado por breakpoint; o cabeçalho deixa essa área livre.
- O foco do botão segue o estilo da aplicação pelas variáveis oficiais `--vlibras-btn-focus-visible-outline/shadow`.
- Com `prefers-reduced-motion: reduce`, a transição de expansão do botão (dentro do shadow root, fora do alcance do CSS global) é desligada.
- Sem cópia local do widget: o carregamento vem do servidor oficial e recebe as atualizações automáticas, como recomenda a documentação.
- O VLibras **complementa, mas não substitui** a acessibilidade da própria interface nem um intérprete humano.

### 4. Validações executadas

| Validação | Resultado |
| --- | --- |
| `npx tsc --noEmit` | sem erros |
| `npm run lint` | sem avisos ou erros |
| `npm test` | 31/31 |
| `npm run build` | concluído, sem erros no log |
| axe-core (WCAG 2.0/2.1/2.2 A e AA, Edge headless, com o VLibras carregado) em login, Painel, Projetos, Novo projeto, Projeto, Novo alvo, Nova avaliação de IA, Alvo, Auditoria, Avaliação de IA e diálogo de revisão | **0 violações** |
| VLibras no navegador | um único script e um único widget após navegar Painel → Projetos → Auditoria; painel oficial abre, avatar carrega e traduz o texto clicado ("Painel") |
| VLibras em 375 px | botão no espaço do cabeçalho (40×40 px), sem sobrepor nenhum link, botão ou campo; sem rolagem horizontal |
| VLibras por teclado / movimento reduzido | botão alcançável por Tab, com nome acessível do próprio plugin; `transition: none` aplicado com `reducedMotion: 'reduce'` |

### 5. Limitações

- O VLibras depende de acesso a `vlibras.gov.br`; sem internet (cenário "100% offline" do README) o botão não aparece, e o restante da aplicação funciona normalmente.
- O painel do avatar, quando aberto pelo usuário, sobrepõe parte do conteúdo — esse é o comportamento padrão do widget e pode ser fechado ou movido pelo próprio painel.
- O teste com leitor de tela (NVDA/VoiceOver) continua pendente.

---

## 2026-10-23 — Revisão de UX/UI e fluxo do MVP

### 1. Bloqueadores corrigidos

| Ref. | Alteração | Arquivos |
| --- | --- | --- |
| B1 | E-mails do seed, README, testes e login padronizados em minúsculas (`auditor@incluvia.local`, `admin@incluvia.local`). As credenciais documentadas voltam a autenticar. | `prisma/seed.ts`, `README.md`, `src/app/login/page.tsx`, `tests/schemas.test.ts` |
| B2 | Seed reescrito (o anterior tinha erro de sintaxe). | `prisma/seed.ts` |
| B3 | Removido `mode: 'insensitive'` (não suportado no SQLite, onde `LIKE` já ignora maiúsculas em ASCII). A busca de achados volta a funcionar. | `api/v1/audits/[auditId]/findings/route.ts`, `api/v1/projects/route.ts` |
| B4 | Login usa o formato real de `/auth/me` (`{ data: user }`) e reconhece sessão ativa. | `src/app/login/page.tsx` |
| B5 | `handleApiError` converte `ZodError` em `422 VALIDATION_ERROR` com `details.fields` (antes: 500). | `src/lib/errors.ts` |
| B6 | Seed demonstrativo: auditoria concluída com 8 achados axe-core ilustrativos (3 já revisados) e avaliação de IA gerada pela rubrica real. Os dados são identificados no campo “Motor” como “dados de demonstração (seed)”. | `prisma/seed.ts` |
| B7 | `.env.example` aponta para o SQLite; `docker-compose.yml` (PostgreSQL não usado) removido. | `.env.example`, `docker-compose.yml` |
| B8 | Parâmetros de paginação ausentes (`null`) são tratados como `undefined`; `GET /projects` deixa de falhar. Teste de regressão adicionado. | `api/v1/projects/route.ts`, `tests/schemas.test.ts` |
| B9 | `.eslintrc.json` com `next/core-web-vitals` (dependência já instalada); `npm run lint` passa a rodar. | `.eslintrc.json` |

### 2. Fluxo e navegação

- **Proteção de rotas na UI:** `src/middleware.ts` redireciona para `/login?next=<destino>` quando não há cookie de sessão; o `api-client` faz o mesmo em respostas `401` (sessão expirada). Após o login o usuário volta à página de origem (só caminhos internos são aceitos, evitando redirecionamento aberto). A API continua sendo a autoridade.
- **Cabeçalho (`AppHeader`):** página atual com `aria-current="page"`, nome do usuário conectado e botão **Sair**; navegação oculta na tela de login. O link ambíguo “Sessão” foi removido.
- **Breadcrumbs** em todas as telas internas: Projetos › Projeto › Alvo › Auditoria / Avaliação de IA (substituem os “← Voltar…” inconsistentes).
- **Painel:** indicadores reais (projetos ativos, alvos, auditorias, avaliações de IA), **Auditorias recentes** com ação “Continuar revisão”/“Acompanhar”, aviso quando há execução em andamento e um guia de 5 passos do fluxo. Novo endpoint `GET /api/v1/audits` (execuções recentes do usuário).
- **Projetos:** filtro padrão “Ativos”, rótulos visíveis nos filtros, “Limpar filtros” e contagem de resultados anunciada.
- **Detalhe do projeto:** alvos web (núcleo do MVP) antes das avaliações de IA; uma ação principal (“Cadastrar alvo web”); aviso de somente leitura em projeto arquivado; arquivamento por `ConfirmDialog` (antes `confirm()`/`alert()`).
- **Alvo:** “Nova auditoria” abre o diálogo **Preparar auditoria** (escopo + limites + confirmação, §6.2 tela 6). O botão some quando já há execução ativa ou o projeto está arquivado, com link para acompanhar. Histórico mostra duração em vez de horários soltos.
- **Auditoria:**
  - resumo por severidade calculado no servidor (`summary` em `GET /audits/:id`) — não muda mais com os filtros e inclui “Leve”;
  - aviso explícito por estado: *Na fila* (depende do worker `npm run worker`), *Em execução* (tempo decorrido), *Falha técnica* (separada de resultado de acessibilidade, §12), *Cancelada*;
  - busca com *debounce* (300 ms), “Limpar filtros” e contagem anunciada;
  - achados ordenados por gravidade (a API ordena alfabeticamente — ver limitações);
  - cancelamento por `ConfirmDialog`; prévia do relatório via `api-client` (antes `fetch` direto).
- **Revisão unificada:** `ReviewDialog` serve achados web e de IA, com opções em botões de rádio e explicação de cada estado (RF-06). Na avaliação de IA, o formulário deixou de aparecer no fim da página, longe do botão clicado.
- **Formulários** (projeto, alvo, avaliação de IA): erros junto ao campo (validação local + `details.fields` do servidor), indicação textual “(obrigatório)/(opcional)”, botões sempre habilitados com explicação do que falta, bloqueio anti-SSRF exibido no campo URL, “Cancelar” em todos.
- **Rubrica de IA:** o trecho de evidência agora preserva acentos e maiúsculas do texto original (antes era exibido normalizado). Teste adicionado.

### 3. Acessibilidade (WCAG 2.2 AA como meta)

| Problema | Correção |
| --- | --- |
| A1 contraste de `--text-muted` 3,3–4,0:1 | `#8796ab` (≥ 5,1:1 em todos os fundos); `--text-secondary` clareado |
| A2 borda de campo 1,3:1 | `--border-strong: #64748b` (≥ 3,2:1) em campos e botões secundários |
| A3 modais sem gestão de foco | `Modal` sobre `<dialog>` nativo: armadilha de foco, fundo inerte, `Esc`, clique fora, foco inicial na opção segura (`data-autofocus`) e retorno do foco ao gatilho |
| A4 obrigatoriedade só com `*` | Texto “(obrigatório)”, `aria-invalid` e `aria-describedby` ligando dica e erro (`Field`) |
| A5 emojis como indicadores | Removidos de botões, opções e títulos |
| A6 estados não anunciados | `LoadingState` e contagens com `role="status"`/`aria-live`; erros com `role="alert"` |
| A7 navegação sem página atual | `aria-current="page"` no cabeçalho e no último item da trilha |
| A8 links “Abrir/Detalhes/Revisar” repetidos | Nome do item vira o link da linha; botões repetidos recebem complemento `sr-only` |
| A9 nova aba sem aviso | “(abre em nova aba)” em `sr-only` nos links externos |
| A10 refluxo no celular | Cabeçalho compacto, filtros em coluna, ações em largura total, resumo em 2 colunas; sem rolagem horizontal a 375 px |
| — títulos de aba idênticos | `PageHeader` define `document.title` por página (“Projetos · Incluvia”) |
| — badges só por cor | Badges com prefixo `sr-only` (“Severidade:”, “Revisão:”) e texto visível |
| — alvos de toque | `min-height` de 40 px (botões) e 32 px (`.btn-sm`), acima dos 24 px do critério 2.5.8 |

### 4. Código e organização

- **Novos módulos compartilhados** (cada um com uso real em 2+ telas):
  - `src/components/`: `AppHeader`, `PageHeader` + `Breadcrumbs`, `Modal` + `ConfirmDialog`, `ReviewDialog`, `FindingCard`, `Field`, `Badges`, `States` (`LoadingState`, `EmptyState`, `ErrorState`), `ProjectsTable`.
  - `src/lib/labels.ts`: fonte única de rótulos (severidade, revisão, estado) e formatação de datas/duração.
  - `src/lib/types.ts`: DTOs da API — removidos todos os `any` das páginas.
  - `src/lib/use-resource.ts`: carregamento/erro/recarga com descarte de respostas obsoletas; `useDebouncedValue`.
- **`api-client` tipado** com `ApiError` (status, código, erros por campo) e helpers `post`/`patch`; URLs de download centralizadas.
- **Estilos:** `style={{…}}` inline substituídos por classes utilitárias em `globals.css` (restam 5 ajustes pontuais de espaçamento/largura); tokens de cor documentados; `.table-container` posicionado para conter elementos `sr-only` (causavam rolagem horizontal).
- **Dead code removido:** `api.getTargets`, `api.getTargetAudits`, CSS `.user-badge`/`.nav-link.active` antigos, `docker-compose.yml`, duplicações de tabela, modal de revisão e mapas de rótulos.
- **Ajustes de API mínimos:** `summary` em `GET /audits/:id`; `GET /audits` (recentes); `status` do projeto em `GET /targets/:id`.

### 5. Validações executadas

| Validação | Resultado |
| --- | --- |
| `npx tsc --noEmit` | sem erros (antes: erro de sintaxe em `seed.ts`) |
| `npm test` (Vitest) | **31/31** passando (antes: 27/28; +3 testes de regressão) |
| `npm run lint` | sem avisos ou erros (antes: não configurado) |
| `npm run build` | build de produção concluído |
| `npm run db:seed` | executado; dados demonstrativos criados |
| axe-core (`@axe-core/playwright`, tags WCAG 2.0/2.1/2.2 A e AA, Edge headless) em `/login`, Painel, Projetos, Novo projeto, Projeto, Novo alvo, Nova avaliação de IA, Alvo, Auditoria, Avaliação de IA e diálogo de revisão | **0 violações** |
| Fluxo manual no navegador | redirecionamento para login com `next`; login com conta demo; painel; busca de achados; revisão salva (resumo 3→4 de 8 com filtro ativo); prévia do relatório; preparar e iniciar auditoria; estado “Na fila”; cancelamento com confirmação; erro anti-SSRF no campo URL; `Esc` e retorno de foco nos diálogos |
| Responsividade | Painel, Projeto, Alvo, Auditoria e Nova avaliação de IA a 375 px sem rolagem horizontal |

Testes automatizados não substituem avaliação manual com leitor de tela, que **não** foi feita nesta etapa.

### 6. Limitações conhecidas e próximos passos

- A API ordena severidade alfabeticamente; a UI reordena por gravidade **dentro da página carregada** (50 achados). Execuções com mais de 50 achados precisam de ordenação no servidor e paginação na UI.
- O resumo do Painel conta auditorias apenas dos projetos do usuário (mesma regra de autorização da API).
- Sem o worker em execução, novas auditorias ficam “Na fila” — isso agora é dito na tela.
- Edição de projeto (`PATCH`) e administração de usuários continuam sem tela.
- Desvio de stack em relação a `arquitetura_paaa_solid.md` (Next.js/SQLite em vez de Vite/Express/PostgreSQL) mantido e documentado na revisão.
- Validação com leitor de tela (NVDA/VoiceOver) e testes E2E da própria interface permanecem pendentes.
