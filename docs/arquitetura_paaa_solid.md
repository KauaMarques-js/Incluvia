# Arquitetura de Software --- Incluvia

## Plataforma de Auditoria e Acessibilidade Algorítmica

**Versão:** 1.0\
**Objetivo deste documento:** servir como especificação de referência
para implementação por um agente de programação (Claude ou
equivalente).\
**Regra principal:** implementar o escopo descrito, sem inventar
funcionalidades, trocar a stack ou ampliar o produto sem autorização.

------------------------------------------------------------------------

# 1. Instrução de execução para o agente de programação

Você deve construir a aplicação descrita neste documento de forma
incremental, simples, testável e coerente com SOLID.

## 1.1 Regras obrigatórias

1.  Leia este documento inteiro antes de escrever código.
2.  **Não amplie o escopo por iniciativa própria.** Não adicione
    pagamentos, planos, marketplace, rede social, gamificação,
    aplicativo mobile nativo, microsserviços, blockchain ou treinamento
    de modelo próprio.
3.  Não implemente recursos não descritos como se fossem requisitos. Se
    uma decisão essencial estiver ausente, registre a dúvida e escolha a
    solução mais simples e reversível, quando isso não afetar segurança
    ou requisitos de negócio.
4.  Preserve a stack definida neste documento. Não substitua bibliotecas
    ou frameworks sem justificar a necessidade e solicitar autorização.
5.  Implemente por etapas pequenas. Ao final de cada etapa, execute os
    testes, corrija falhas e informe o que foi entregue.
6.  Não deixe botões decorativos ou fluxos simulados sem indicação. Uma
    funcionalidade apresentada como disponível deve funcionar de ponta a
    ponta.
7.  Não afirme que um sistema está "livre de capacitismo", "totalmente
    acessível" ou "certificado" por causa de uma varredura automatizada.
    Os resultados são indícios e achados que precisam de contexto e, em
    alguns casos, validação humana.
8.  Não armazene dados pessoais ou dados de saúde de participantes sem
    necessidade explícita. Não deduza deficiência de uma pessoa.
9.  Nunca execute testes contra sites de terceiros sem autorização. No
    MVP, a auditoria deve operar sobre uma URL autorizada pelo usuário e
    validar o destino antes de iniciar a navegação automatizada.
10. Priorize legibilidade, coesão, baixo acoplamento, segurança,
    acessibilidade e testes sobre abstrações desnecessárias.

## 1.2 Processo de trabalho

Antes de implementar: - inspecione o repositório existente; - informe a
estrutura e as tecnologias já presentes; - compare-as com a stack deste
documento; - preserve código útil existente; - proponha mudanças somente
quando necessárias.

Se o repositório estiver vazio, crie a estrutura mínima especificada
abaixo.

Não gere toda a aplicação em um único arquivo. Não use "god classes",
controladores gigantes, componentes React gigantes ou acesso ao banco de
dados diretamente pela interface.

------------------------------------------------------------------------

# 2. Visão do produto

A Incluvia é uma aplicação web para organizar auditorias de acessibilidade e
riscos de capacitismo algorítmico em sites e, em uma fase posterior, em
respostas de sistemas de IA.

O MVP deve priorizar **auditoria web de acessibilidade**, com registro
de projetos, execução controlada de testes, apresentação de achados e
relatórios. A avaliação de respostas de IA deve ser tratada como uma
extensão posterior, não como motivo para atrasar o núcleo funcional.

## 2.1 Objetivo principal

Permitir que uma pessoa responsável por uma auditoria: 1. crie um
projeto de auditoria; 2. cadastre um site autorizado; 3. execute testes
automatizados de acessibilidade; 4. consulte achados com evidências; 5.
revise e classifique achados; 6. acompanhe o estado das correções; 7.
exporte um relatório em Markdown.

## 2.2 Usuários principais

-   **Auditor:** cria projetos, executa auditorias, revisa achados e
    exporta relatórios.
-   **Administrador:** gerencia acesso e configurações básicas da
    aplicação.
-   **Consultor/revisor:** pode ser um papel futuro. Não é necessário
    implementar permissões granulares complexas no MVP.

No MVP, a aplicação pode começar com autenticação e os papéis `admin` e
`auditor`. Não criar cadastro público aberto sem necessidade.

## 2.3 Fora do escopo do MVP

-   Diagnosticar ou classificar a deficiência de uma pessoa.
-   Avaliar pessoas para emprego, benefícios, crédito, educação ou
    saúde.
-   Tomar decisões automatizadas de alto impacto.
-   Declarar conformidade jurídica ou certificação automática.
-   Executar auditoria de modelos de visão computacional, fala ou
    recrutamento.
-   Criar uma API pública para terceiros.
-   Treinar um modelo de IA próprio.
-   Criar planos pagos, assinaturas ou pagamentos.
-   Criar aplicativo mobile nativo.
-   Criar microsserviços ou arquitetura distribuída.
-   Integrar vários provedores de IA antes de existir necessidade
    comprovada.

------------------------------------------------------------------------

# 3. Stack tecnológica

Usar versões estáveis compatíveis no momento da implementação e
registrar as versões instaladas nos arquivos de dependências.

  -----------------------------------------------------------------------
  Camada                  Tecnologia              Responsabilidade
  ----------------------- ----------------------- -----------------------
  Front-end               React + TypeScript +    Interface web
                          Vite                    

  Estilização             CSS Modules ou CSS      Layout e estados
                          organizado por          visuais
                          componente; escolher    
                          uma abordagem e manter  
                          consistência            

  Roteamento              React Router            Navegação

  Formulários             React Hook Form + Zod   Validação de
                                                  formulários no cliente

  Back-end                Node.js + TypeScript +  API REST
                          Express                 

  Validação de API        Zod                     Validar parâmetros,
                                                  corpo e configurações

  Banco de dados          PostgreSQL              Persistência

  Acesso a dados          Prisma ORM              Consultas e migrações

  Testes de navegador     Playwright              Navegação e testes
                                                  controlados

  Auditoria automatizada  axe-core, integrado ao  Detectar problemas
                          Playwright              comuns de
                                                  acessibilidade

  Testes unitários        Vitest                  Testes de unidades

  Testes de API           Vitest + Supertest      Testes de integração

  Documentação da API     OpenAPI/Swagger         Contrato dos endpoints

  Execução local          Docker Compose          API e PostgreSQL no
                                                  ambiente de
                                                  desenvolvimento
  -----------------------------------------------------------------------

Não introduzir Redux, Kafka, Redis, Kubernetes, GraphQL, event sourcing,
CQRS ou microsserviços no MVP. Só considerar tecnologia adicional
mediante necessidade técnica concreta e aprovação.

------------------------------------------------------------------------

# 4. Requisitos funcionais

## RF-01 --- Autenticação

O sistema deve permitir login e logout de usuários autorizados.

-   Não armazenar senhas em texto puro.
-   Usar hash de senha com algoritmo adequado, como Argon2id ou bcrypt
    configurado corretamente.
-   Proteger rotas privadas no front-end e, principalmente, na API.
-   Mensagens de erro de login não devem revelar desnecessariamente se
    um e-mail existe.
-   Não armazenar tokens de sessão sensíveis em `localStorage`.
-   Preferir cookie de sessão `HttpOnly`, `Secure` em produção e
    `SameSite` apropriado.

## RF-02 --- Projetos de auditoria

O auditor deve poder: - listar projetos aos quais tem acesso; - criar um
projeto; - visualizar detalhes; - editar nome e descrição; - arquivar um
projeto, sem apagar seu histórico de forma silenciosa.

Campos mínimos: - nome; - descrição opcional; - status (`active`,
`archived`); - criador; - datas de criação e atualização.

## RF-03 --- Cadastro de alvo

Cada projeto deve permitir cadastrar um alvo de auditoria.

Campos mínimos: - nome identificador; - URL inicial; - descrição
opcional; - confirmação de que o usuário tem autorização para testar o
alvo.

A aplicação deve validar protocolo e destino antes de executar testes.
No MVP, permitir somente `http` e `https`, bloquear destinos
locais/privados e metadados de nuvem, restringir redirecionamentos e
revalidar cada destino alcançado para mitigar SSRF. O navegador de teste
deve rodar isolado e sem credenciais pessoais do servidor.

Não oferecer campo para inserir scripts arbitrários nem permitir upload
de executáveis.

## RF-04 --- Execução da auditoria

O auditor deve poder iniciar uma auditoria sobre um alvo autorizado.

A auditoria deve: - registrar horário de início e fim; - registrar
estado (`queued`, `running`, `completed`, `failed`, `cancelled`); - usar
Playwright para abrir páginas dentro do escopo permitido; - integrar
axe-core para detectar problemas comuns; - limitar número de páginas,
profundidade, tempo total e recursos consumidos; - registrar erros de
navegação sem interromper todo o processo quando for possível
continuar; - manter o resultado acessível após a execução.

Para o primeiro MVP, auditar somente a URL inicial e links internos do
mesmo host, com limite configurável conservador. Não rastrear a internet
inteira.

## RF-05 --- Achados

Cada execução deve poder produzir achados.

Cada achado deve conter, quando disponível: - regra ou identificador da
ferramenta; - título; - descrição; - impacto/severidade informada pela
ferramenta; - elemento afetado ou seletor, quando seguro; - URL da
página; - orientação técnica de correção; - estado de revisão; - data de
criação.

A ferramenta pode reportar `critical`, `serious`, `moderate`, `minor` ou
equivalente. Não converter automaticamente severidade técnica em uma
conclusão legal ou em "nível de capacitismo".

## RF-06 --- Revisão humana

O auditor deve poder marcar cada achado como: - `unreviewed` --- ainda
não revisado; - `confirmed` --- confirmado após revisão; -
`false_positive` --- falso positivo; - `needs_context` --- exige
avaliação adicional; - `fixed` --- correção verificada por nova
execução.

A revisão pode conter uma nota curta. Não incluir dados sensíveis
desnecessários.

## RF-07 --- Histórico

O usuário deve poder consultar execuções anteriores de um alvo e
comparar quantidade e tipos de achados. Comparações devem indicar
claramente que alterações no conteúdo, versão da ferramenta ou
configuração podem afetar os resultados.

## RF-08 --- Relatório Markdown

O usuário deve poder gerar e baixar um relatório Markdown com: -
identificação do projeto e alvo; - data e versão da execução; - escopo e
limitações; - resumo de resultados; - achados agrupados por
severidade; - estado da revisão; - recomendações técnicas; - aviso de
que testes automatizados não comprovam acessibilidade total nem ausência
de discriminação.

O relatório não deve expor cookies, credenciais, tokens, dados pessoais
ou conteúdo sensível coletado acidentalmente.

------------------------------------------------------------------------

# 5. Requisitos não funcionais

## RNF-01 --- Acessibilidade

A interface deve seguir WCAG 2.2 nível AA como objetivo de projeto. Isso
é uma meta de implementação, não uma declaração automática de
conformidade.

Requisitos mínimos: - navegação por teclado; - foco visível; - estrutura
semântica de títulos; - rótulos associados a campos; - mensagens de erro
compreensíveis; - contraste adequado; - não depender apenas de cor para
comunicar estado; - compatibilidade razoável com leitores de tela; -
tabelas e gráficos com alternativas textuais; - respeito a
`prefers-reduced-motion`; - layouts responsivos e zoom sem perda de
conteúdo.

## RNF-02 --- Segurança

-   Validar entrada no servidor.
-   Usar consultas parametrizadas/ORM.
-   Aplicar autorização em todos os recursos privados.
-   Configurar CORS para origens conhecidas.
-   Implementar rate limiting nos endpoints de autenticação.
-   Configurar cabeçalhos de segurança.
-   Evitar registrar senhas, cookies, tokens ou conteúdo sensível em
    logs.
-   Manter segredos em variáveis de ambiente, nunca no repositório.
-   Restringir a execução de Playwright em ambiente isolado.
-   Proteger contra SSRF, acesso a redes privadas, redirecionamentos
    maliciosos e consumo excessivo de recursos.
-   Não permitir que o processo de auditoria use a rede interna da
    aplicação ou credenciais do ambiente.

## RNF-03 --- Manutenibilidade

-   TypeScript com `strict: true`.
-   Funções e classes com responsabilidade única.
-   Dependências explícitas por construtor ou composição.
-   Separação entre HTTP, regras de negócio, persistência e integrações
    externas.
-   Testes para regras de negócio e casos críticos.
-   Nomes claros e código formatado por ferramenta automatizada.
-   Sem duplicação significativa de regras de negócio.

## RNF-04 --- Desempenho e confiabilidade

-   Auditorias devem executar fora do ciclo de requisição HTTP quando
    puderem demorar.
-   A API deve responder com um identificador de execução e permitir
    consultar o estado.
-   Limitar concorrência e duração das auditorias.
-   Tratar falhas externas com mensagens úteis e logs técnicos sem dados
    sensíveis.
-   Não prometer disponibilidade ou escalabilidade que ainda não foi
    testada.

Para o MVP, pode-se usar um processo worker separado dentro do mesmo
repositório, com uma tabela de tarefas no PostgreSQL. Não adicionar fila
externa sem necessidade comprovada.

## RNF-05 --- Privacidade

-   Coletar apenas dados necessários.
-   Definir retenção e exclusão para resultados e logs.
-   Não solicitar diagnóstico de deficiência.
-   Não enviar páginas auditadas a provedores de IA.
-   Não usar dados de auditoria para treinamento de modelos.
-   Documentar limites e finalidade de cada dado armazenado.

------------------------------------------------------------------------

# 6. UX e arquitetura de informação

## 6.1 Direção de UX

A experiência deve transmitir clareza, confiança e rigor técnico, sem
transformar o resultado em um "placar de preconceito". O usuário precisa
entender o que foi testado, o que foi encontrado, quais são as
limitações e qual ação pode tomar.

Princípios: - tarefas principais evidentes; - linguagem simples, sem
eliminar precisão técnica; - mostrar progresso e estados vazios; -
evitar modais desnecessários; - permitir navegação por teclado; -
oferecer explicações junto a termos técnicos; - não depender
exclusivamente de gráficos ou cores; - separar resultados automatizados
de conclusões revisadas por pessoas.

## 6.2 Mapa de telas

1.  **Login**
2.  **Painel**
    -   resumo dos projetos;
    -   auditorias recentes;
    -   ações "Criar projeto" e "Continuar auditoria".
3.  **Projetos**
    -   lista, pesquisa simples e estado;
    -   criar projeto.
4.  **Detalhe do projeto**
    -   descrição;
    -   alvos cadastrados;
    -   histórico de auditorias;
    -   botão "Adicionar alvo".
5.  **Adicionar alvo**
    -   nome;
    -   URL;
    -   declaração de autorização;
    -   explicação dos limites de segurança.
6.  **Preparar auditoria**
    -   alvo selecionado;
    -   escopo de páginas;
    -   limites da execução;
    -   confirmação antes de iniciar.
7.  **Execução em andamento**
    -   estado;
    -   tempo decorrido, se disponível;
    -   mensagem clara se houver falha;
    -   opção de cancelar, se implementada com segurança.
8.  **Resultado da auditoria**
    -   resumo textual;
    -   filtros por severidade e revisão;
    -   lista de achados;
    -   indicação de limitações.
9.  **Detalhe do achado**
    -   título e descrição;
    -   página afetada;
    -   regra de acessibilidade;
    -   evidência minimizada;
    -   recomendação;
    -   controle de revisão.
10. **Histórico**
    -   execuções anteriores;
    -   comparação de resultados com aviso sobre diferenças de
        configuração.
11. **Exportar relatório**
    -   prévia do conteúdo;
    -   botão para gerar/baixar Markdown.
12. **Configurações básicas**
    -   conta e logout;
    -   administração de usuários, apenas se o papel admin for
        implementado.

## 6.3 Fluxo principal

``` text
Login
  |
  v
Painel
  |
  v
Criar ou abrir projeto
  |
  v
Cadastrar alvo autorizado
  |
  v
Revisar escopo da auditoria
  |
  v
Iniciar execução
  |
  v
Consultar estado da execução
  |
  v
Visualizar e filtrar achados
  |
  v
Revisar achados
  |
  v
Exportar relatório Markdown
```

## 6.4 Componentes de interface sugeridos

-   `AppShell`: navegação e estrutura principal.
-   `Sidebar` ou `TopNavigation`: navegação principal responsiva.
-   `PageHeader`: título, descrição e ação principal.
-   `ProjectCard` ou `ProjectTable`: resumo de projetos.
-   `AuditStatus`: estado textual da execução.
-   `SeverityLabel`: rótulo textual da severidade; não comunicar
    severidade apenas por cor.
-   `FindingsTable`: tabela acessível de achados.
-   `FindingFilters`: filtros.
-   `FindingReviewForm`: revisão humana.
-   `EmptyState`: orientação quando não há dados.
-   `ErrorState`: mensagem de erro e ação de recuperação.
-   `ConfirmDialog`: confirmação somente para ações destrutivas ou de
    impacto.
-   `MarkdownExportButton`: exportação de relatório.

Evitar criar um sistema de design excessivamente complexo no MVP. Os
componentes devem ser reutilizáveis quando existir uso real em mais de
uma tela.

## 6.5 Estados obrigatórios de UX

Toda tela que carrega dados deve considerar: - carregando; - sucesso com
dados; - sucesso sem dados; - falha; - falta de permissão; - recurso
inexistente.

Formulários devem apresentar erros perto dos campos, preservar dados
válidos quando possível e explicar como corrigir a entrada.

------------------------------------------------------------------------

# 7. Arquitetura lógica

Usar um **monólito modular**, organizado por funcionalidades e camadas.
O sistema terá um front-end separado e uma API, mas o back-end será uma
única aplicação Node.js.

``` text
[ React + TypeScript ]
          |
          | HTTPS / JSON
          v
[ Express REST API ]
          |
          v
[ Controllers / HTTP ]
          |
          v
[ Application Services / Use Cases ]
          |
          +-------------------+
          |                   |
          v                   v
[ Domain Rules ]      [ Ports / Interfaces ]
                              |
                 +------------+------------+
                 |                         |
                 v                         v
        [ Prisma Repository ]      [ Audit Engine ]
                 |                         |
                 v                         v
           [ PostgreSQL ]          [ Playwright + axe-core ]
```

## 7.1 Camadas do back-end

### Presentation / HTTP

Responsável por: - receber requisições; - validar formato de entrada; -
chamar casos de uso; - converter resultados em respostas HTTP; - mapear
erros conhecidos para códigos HTTP.

Não deve conter regras de negócio complexas nem consultas diretas
espalhadas pelo banco.

### Application

Responsável por orquestrar casos de uso, por exemplo: -
`CreateProject`; - `RegisterAuditTarget`; - `StartAudit`; -
`GetAuditStatus`; - `ListFindings`; - `ReviewFinding`; -
`GenerateMarkdownReport`.

Os casos de uso coordenam domínio e interfaces externas. Não devem
depender diretamente de objetos do Express ou de detalhes de UI.

### Domain

Responsável pelas entidades, enums, invariantes e regras centrais: -
projeto; - alvo; - execução de auditoria; - achado; - estado de
revisão; - validações de transição de estado.

O domínio não deve importar Express, Prisma, Playwright ou bibliotecas
de interface.

### Infrastructure

Responsável por: - implementação dos repositórios com Prisma; - execução
de Playwright e axe-core; - autenticação e hashing; - geração do
Markdown; - logs; - configuração e acesso a serviços externos.

## 7.2 Organização de pastas sugerida

``` text
Incluvia/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── targets/
│   │   │   │   ├── audits/
│   │   │   │   ├── findings/
│   │   │   │   └── reports/
│   │   │   ├── lib/
│   │   │   ├── routes/
│   │   │   └── styles/
│   │   └── tests/
│   └── api/
│       ├── src/
│       │   ├── app.ts
│       │   ├── server.ts
│       │   ├── config/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── projects/
│       │   │   ├── targets/
│       │   │   ├── audits/
│       │   │   ├── findings/
│       │   │   └── reports/
│       │   ├── shared/
│       │   │   ├── errors/
│       │   │   ├── http/
│       │   │   ├── logging/
│       │   │   └── security/
│       │   └── workers/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── tests/
├── docs/
├── docker-compose.yml
├── .env.example
├── README.md
└── package.json
```

Cada módulo de back-end deve conter somente as subpastas necessárias,
por exemplo `domain`, `application`, `infrastructure` e `presentation`.
Não criar arquivos vazios ou camadas sem responsabilidade real apenas
para preencher a estrutura.

------------------------------------------------------------------------

# 8. SOLID: regras práticas obrigatórias

SOLID deve orientar a estrutura, sem gerar abstrações artificiais.

## S --- Single Responsibility Principle

Cada módulo, classe ou função deve ter uma razão principal para mudar.

Bom: - `CreateProjectService` cria projetos; - `PrismaProjectRepository`
persiste projetos; - `MarkdownReportGenerator` formata relatórios; -
`PlaywrightAuditEngine` executa auditorias.

Ruim: - `AuditManager` autentica usuários, consulta banco, executa
navegador, classifica resultados e monta relatórios em uma única
classe. - Um componente React que busca dados, aplica todas as regras,
monta a página e realiza exportação.

## O --- Open/Closed Principle

O sistema deve permitir extensão controlada sem modificar
desnecessariamente as regras centrais.

Exemplo: - definir uma interface `AuditEngine`; - implementar
`PlaywrightAuditEngine`; - no futuro, adicionar outra implementação
apenas se houver requisito real.

Não criar plugins dinâmicos ou sistema genérico de extensões no MVP.

## L --- Liskov Substitution Principle

Implementações de uma interface devem respeitar seu contrato.

Se uma implementação de `AuditEngine` aceita um alvo e retorna
resultados, todas as implementações devem respeitar os mesmos tipos,
estados de erro e garantias documentadas. Não retornar formatos
incompatíveis ou ignorar silenciosamente limites de segurança.

## I --- Interface Segregation Principle

Prefira interfaces pequenas, específicas e focadas no consumidor.

Evitar uma interface gigante `IAuditSystem` com dezenas de métodos.
Separar contratos, por exemplo: - `AuditEngine`; -
`ProjectRepository`; - `AuditRepository`; - `FindingRepository`; -
`ReportGenerator`.

Não criar uma interface para cada função trivial sem benefício concreto.

## D --- Dependency Inversion Principle

Casos de uso devem depender de contratos, não de detalhes de
infraestrutura.

Exemplo conceitual:

``` ts
interface AuditEngine {
  run(input: AuditInput): Promise<AuditResult>;
}

class StartAudit {
  constructor(
    private readonly audits: AuditRepository,
    private readonly engine: AuditEngine
  ) {}

  // A implementação coordena o caso de uso.
  // Ela não importa Playwright nem Prisma diretamente.
}
```

A composição da aplicação conecta as implementações concretas. Não usar
um container de injeção de dependência complexo no MVP; injeção por
construtor e composição explícita são suficientes.

## 8.1 Regras adicionais de design

-   Preferir composição a herança.
-   Evitar padrões de projeto sem um problema concreto.
-   Não usar classes estáticas globais para acessar banco ou
    configuração.
-   Evitar `any`; usar tipos explícitos e `unknown` com validação quando
    necessário.
-   Evitar `catch` que ignora erros.
-   Não duplicar a mesma regra de negócio no front-end e no back-end
    como fonte de verdade. O front-end pode antecipar validações, mas o
    back-end valida novamente.
-   Não colocar regras de negócio dentro de componentes React.
-   Não permitir que o domínio conheça detalhes de Prisma, Express ou
    Playwright.
-   Não criar abstrações prematuras para funcionalidades futuras.

------------------------------------------------------------------------

# 9. Modelo de dados inicial

Modelo relacional mínimo. Os nomes podem ser adaptados à convenção
escolhida, mas a semântica deve permanecer.

## User

-   `id`: UUID.
-   `name`: texto.
-   `email`: texto único, normalizado.
-   `passwordHash`: texto.
-   `role`: `admin` ou `auditor`.
-   `createdAt`, `updatedAt`.

## Project

-   `id`: UUID.
-   `name`: texto obrigatório.
-   `description`: texto opcional.
-   `status`: `active` ou `archived`.
-   `createdById`: FK para User.
-   `createdAt`, `updatedAt`.

## AuditTarget

-   `id`: UUID.
-   `projectId`: FK para Project.
-   `name`: texto.
-   `startUrl`: texto.
-   `authorizationConfirmedAt`: data/hora.
-   `createdAt`, `updatedAt`.

## AuditRun

-   `id`: UUID.
-   `targetId`: FK para AuditTarget.
-   `status`: `queued`, `running`, `completed`, `failed`, `cancelled`.
-   `startedAt`, `finishedAt`: datas opcionais.
-   `toolVersion`: texto.
-   `configuration`: JSON com limites e opções não sensíveis.
-   `errorCode`: código interno opcional, sem segredo.
-   `createdById`: FK para User.
-   `createdAt`.

## Finding

-   `id`: UUID.
-   `auditRunId`: FK para AuditRun.
-   `ruleId`: texto.
-   `title`: texto.
-   `description`: texto.
-   `impact`: `critical`, `serious`, `moderate`, `minor`, `unknown`.
-   `pageUrl`: texto.
-   `elementSelector`: texto opcional.
-   `helpUrl`: texto opcional.
-   `reviewStatus`: `unreviewed`, `confirmed`, `false_positive`,
    `needs_context`, `fixed`.
-   `reviewNote`: texto opcional.
-   `reviewedById`: FK opcional para User.
-   `reviewedAt`: data/hora opcional.
-   `createdAt`.

## Regras de dados

-   Usar UUIDs e chaves estrangeiras.
-   Criar índices para consultas frequentes por projeto, alvo, execução,
    estado e data.
-   Não guardar HTML integral de páginas por padrão.
-   Não guardar capturas de tela por padrão.
-   Evitar duplicar informação derivável sem necessidade.
-   A exclusão e retenção devem ser deliberadas; arquivar projeto não
    deve apagar auditorias.
-   Guardar apenas evidências técnicas necessárias e sanitizadas.

------------------------------------------------------------------------

# 10. API REST inicial

Prefixo: `/api/v1`

## Autenticação

-   `POST /auth/login`
-   `POST /auth/logout`
-   `GET /auth/me`

## Projetos

-   `GET /projects`
-   `POST /projects`
-   `GET /projects/:projectId`
-   `PATCH /projects/:projectId`
-   `POST /projects/:projectId/archive`

## Alvos

-   `GET /projects/:projectId/targets`
-   `POST /projects/:projectId/targets`
-   `GET /targets/:targetId`

## Auditorias

-   `POST /targets/:targetId/audits`
-   `GET /audits/:auditId`
-   `POST /audits/:auditId/cancel`
-   `GET /audits/:auditId/findings`
-   `GET /targets/:targetId/audits`

## Achados

-   `GET /findings/:findingId`
-   `PATCH /findings/:findingId/review`

## Relatórios

-   `GET /audits/:auditId/report.md`

## Padrões de API

-   JSON em endpoints comuns.
-   Códigos HTTP coerentes (`200`, `201`, `202`, `400`, `401`, `403`,
    `404`, `409`, `422`, `429`, `500`).
-   Respostas de erro padronizadas, sem stack trace para o cliente.
-   Paginação para listas potencialmente grandes.
-   Validar todo parâmetro, query e corpo no servidor.
-   Confirmar autorização sobre o projeto/alvo antes de devolver dados.
-   Documentar endpoints com OpenAPI.
-   `POST /targets/:targetId/audits` deve retornar `202 Accepted` e o
    identificador da execução se o processamento for assíncrono.

Exemplo de resposta ao iniciar auditoria:

``` json
{
  "data": {
    "id": "uuid-da-execucao",
    "status": "queued"
  }
}
```

Exemplo de erro:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Verifique os campos informados."
  }
}
```

------------------------------------------------------------------------

# 11. Segurança específica para auditoria de URLs

Este ponto é obrigatório: a funcionalidade que abre URLs fornecidas por
usuários pode ser abusada para acessar serviços internos.

Implementar, no mínimo: - aceitar apenas protocolos `http` e `https`; -
bloquear `localhost`, endereços privados, loopback, link-local,
multicast e endereços de metadados de provedores de nuvem; - resolver
DNS e validar endereços IP antes da conexão; - revalidar após
redirecionamentos; - impedir redirecionamentos para redes proibidas; -
limitar portas permitidas conforme necessidade do produto; - limitar
tamanho de resposta, tempo, quantidade de páginas e concorrência; -
executar o navegador em processo/container isolado; - não montar
diretórios sensíveis nem disponibilizar segredos ao worker; - bloquear
acesso a arquivos locais (`file://`) e protocolos não HTTP; - registrar
tentativas bloqueadas sem armazenar conteúdo desnecessário; - ter testes
automatizados para URLs maliciosas e redirecionamentos.

Não considerar uma validação superficial de string como proteção
suficiente. Usar uma abordagem de validação de URL e rede em
profundidade. Se o ambiente não puder garantir isolamento seguro,
desabilitar a execução de URLs arbitrárias e operar apenas em um
conjunto de alvos explicitamente permitido.

------------------------------------------------------------------------

# 12. Pipeline de execução de auditoria

1.  API recebe solicitação autenticada.
2.  Valida se o usuário tem acesso ao alvo.
3.  Valida URL, escopo e limites de execução.
4.  Cria `AuditRun` com status `queued`.
5.  Worker busca uma execução pendente.
6.  Worker marca status `running`.
7.  Worker abre o navegador isolado.
8.  Visita somente páginas dentro do escopo autorizado.
9.  Executa axe-core e normaliza os resultados.
10. Persiste achados de forma transacional ou em lotes controlados.
11. Marca a execução como `completed` ou `failed`.
12. Front-end consulta o estado e atualiza a interface.
13. Usuário revisa achados e exporta relatório.

Falhas de navegação devem ser registradas como falhas técnicas da
execução, não como problemas de acessibilidade do site. A auditoria deve
diferenciar "não foi possível testar" de "teste realizado sem achados".

------------------------------------------------------------------------

# 13. Arquitetura do front-end

## 13.1 Organização por funcionalidade

-   `features/auth`: login e sessão.
-   `features/projects`: lista, criação e detalhe de projetos.
-   `features/targets`: cadastro e detalhe de alvos.
-   `features/audits`: iniciar execução, estado e histórico.
-   `features/findings`: lista, filtros e revisão de achados.
-   `features/reports`: visualização e exportação.

Cada funcionalidade deve agrupar componentes, hooks, schemas e serviços
relacionados. Evitar um diretório global com dezenas de componentes sem
relação.

## 13.2 Camada de acesso à API

-   Criar um cliente HTTP centralizado.
-   Centralizar tratamento de erros e sessão.
-   Tipar as respostas.
-   Não realizar chamadas `fetch` diretamente em cada componente visual.
-   Não colocar segredos no bundle do front-end.
-   Não considerar uma rota protegida apenas porque o botão está oculto;
    a API é a autoridade.

## 13.3 Estado da aplicação

No MVP: - usar estado local React para interações locais; - usar hooks
específicos para carregar e atualizar dados; - adicionar uma biblioteca
de cache/estado remoto somente se a complexidade real justificar.

Não introduzir uma biblioteca global de estado por padrão. Não armazenar
dados sensíveis no armazenamento persistente do navegador.

## 13.4 Design visual

Direção visual sugerida: - interface limpa, profissional e discreta; -
hierarquia clara entre título, descrição, dados e ações; - tipografia
legível; - espaçamento consistente; - paleta com contraste adequado; -
cores de severidade acompanhadas de texto e/ou ícone; - gráficos apenas
quando facilitarem uma decisão; - sem animações decorativas
obrigatórias.

Não priorizar estética em detrimento de acessibilidade. Não imitar um
produto existente sem necessidade.

------------------------------------------------------------------------

# 14. Estratégia de testes

## Testes unitários

Cobrir: - validação de transição de status; - regras de autorização; -
criação e atualização de projetos; - normalização de resultados; -
classificação e revisão de achados; - geração do relatório Markdown.

## Testes de integração

Cobrir: - endpoints e validação de entrada; - autenticação e
autorização; - persistência PostgreSQL; - comportamento quando o banco
falha; - fluxo de início e consulta de auditoria; - revisão de
achados; - exportação de relatório.

## Testes de ponta a ponta

Cobrir pelo menos: 1. login; 2. criar projeto; 3. cadastrar alvo de
teste local controlado; 4. executar auditoria; 5. consultar achados; 6.
revisar um achado; 7. exportar relatório.

Usar um site de teste sob controle do projeto. Não depender de sites
externos instáveis nos testes automatizados.

## Testes de acessibilidade da própria Incluvia

-   axe-core nas páginas principais;
-   navegação por teclado;
-   foco visível;
-   rótulos e mensagens de erro;
-   revisão manual de fluxos críticos;
-   teste com leitor de tela em pelo menos um navegador/ambiente
    relevante durante a validação.

Testes automatizados de acessibilidade não substituem avaliação manual.

------------------------------------------------------------------------

# 15. Critérios de aceite do MVP

O MVP será considerado funcional quando:

-   [ ] Um usuário autorizado consegue entrar e sair.
-   [ ] É possível criar, listar, abrir e arquivar projetos.
-   [ ] É possível cadastrar um alvo com confirmação de autorização.
-   [ ] URLs inválidas ou proibidas são recusadas.
-   [ ] É possível iniciar uma auditoria e consultar seu estado.
-   [ ] A auditoria executa axe-core por meio de Playwright no ambiente
    controlado.
-   [ ] Os achados são persistidos e vinculados à execução correta.
-   [ ] O usuário consegue filtrar achados e revisar seu estado.
-   [ ] É possível consultar execuções anteriores.
-   [ ] É possível exportar um relatório Markdown sem segredos ou dados
    sensíveis.
-   [ ] Há testes automatizados para os fluxos essenciais.
-   [ ] A aplicação apresenta estados de carregamento, vazio e erro.
-   [ ] A interface permite navegação básica por teclado.
-   [ ] A documentação explica instalação, configuração, migrações e
    execução de testes.
-   [ ] A aplicação diferencia falha técnica, achado automatizado e
    conclusão de revisão humana.

------------------------------------------------------------------------

# 16. Plano de implementação

Implementar na ordem abaixo. Não iniciar a fase seguinte enquanto a
atual estiver quebrada.

## Fase 1 --- Base do repositório

-   confirmar stack;
-   configurar TypeScript strict;
-   criar front-end e API;
-   configurar PostgreSQL e Prisma;
-   criar `.env.example`;
-   configurar lint, formatação e testes;
-   documentar comandos de desenvolvimento.

**Saída:** projeto inicia localmente com instruções reproduzíveis.

## Fase 2 --- Autenticação e projetos

-   login/logout;
-   controle de acesso;
-   modelo `User` e `Project`;
-   endpoints e telas de projeto;
-   testes.

**Saída:** usuário autorizado consegue criar e administrar projetos.

## Fase 3 --- Alvos e segurança

-   modelo `AuditTarget`;
-   formulário de cadastro;
-   validação de URL;
-   proteções contra SSRF e destinos internos;
-   testes de segurança.

**Saída:** alvo autorizado é armazenado com controles básicos de
segurança.

## Fase 4 --- Motor de auditoria

-   modelo `AuditRun`;
-   worker de processamento;
-   integração Playwright + axe-core;
-   limites de execução;
-   persistência de achados;
-   consulta de estado;
-   testes com alvo local controlado.

**Saída:** auditoria ponta a ponta funcional.

## Fase 5 --- Revisão e relatórios

-   lista e detalhe de achados;
-   filtros;
-   revisão humana;
-   histórico;
-   exportação Markdown;
-   testes.

**Saída:** auditor consegue interpretar e documentar resultados.

## Fase 6 --- Acessibilidade e estabilização

-   auditoria da própria interface;
-   correção de bugs;
-   revisão de autorização e segurança;
-   documentação;
-   demonstração do fluxo completo.

**Saída:** MVP demonstrável com limitações conhecidas documentadas.

## Fase posterior --- Testes de viés em IA

Somente após o MVP estar estável: - definir metodologia de avaliação; -
criar biblioteca de cenários; - implementar integração opcional com
provedor de IA; - guardar apenas dados necessários; - construir rubrica
de avaliação; - incluir revisão humana; - registrar versão do modelo e
limitações; - não apresentar o resultado como prova automática de
discriminação.

------------------------------------------------------------------------

# 17. Definição de pronto para cada tarefa

Uma tarefa só está concluída quando: - o comportamento solicitado
funciona; - as validações são feitas no servidor quando aplicável; - os
estados de erro são tratados; - os testes relevantes passam; - a
interface é utilizável por teclado quando envolve UI; - não há segredos
no código; - a documentação foi atualizada se necessário; - não foram
introduzidas dependências ou funcionalidades fora do escopo; - as
alterações foram resumidas de forma objetiva.

Ao terminar cada fase, apresentar: 1. arquivos e módulos
criados/alterados; 2. funcionalidades implementadas; 3. testes
executados e resultados; 4. limitações conhecidas; 5. comandos para
executar; 6. qualquer desvio da arquitetura e sua justificativa.

Não alegar que testes foram executados se não foram executados.

------------------------------------------------------------------------

# 18. Decisões técnicas finais

1.  Arquitetura: monólito modular, não microsserviços.
2.  Front-end: React + TypeScript + Vite.
3.  Back-end: Node.js + TypeScript + Express.
4.  Banco: PostgreSQL + Prisma.
5.  Auditoria web: Playwright + axe-core.
6.  API: REST versionada em `/api/v1`.
7.  Relatório inicial: Markdown.
8.  Princípios de design: SOLID aplicado com pragmatismo.
9.  Segurança: auditoria de URL isolada e com mitigação explícita de
    SSRF.
10. Prioridade: MVP de acessibilidade web primeiro; análise de viés em
    respostas de IA depois.
11. Não implementar funcionalidades fora deste documento sem aprovação.
12. Não declarar conformidade total ou ausência de capacitismo com base
    apenas em automação.

**Resultado esperado:** uma aplicação web de auditoria acessível, segura
e testável, com arquitetura simples e extensível, que documenta
barreiras técnicas sem alegar conclusões que seus métodos não conseguem
comprovar.
