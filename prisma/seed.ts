import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';
import { UserRole } from '../src/lib/enums';
import { getAiScenario } from '../src/lib/ai-scenarios';
import { prepareEvaluation, toCreateData } from '../src/lib/ai-evaluation-service';

const prisma = new PrismaClient();

const DEMO_PROJECT_NAME = 'Auditoria Piloto — Portal Institucional';
const DEMO_URL = 'https://example.com';

/**
 * Achados ilustrativos no formato normalizado do axe-core.
 * Servem apenas para demonstrar revisão e relatório sem depender do worker.
 */
const DEMO_FINDINGS = [
  {
    ruleId: 'image-alt',
    title: 'Imagens devem ter texto alternativo',
    description: 'O banner principal não possui atributo alt; leitores de tela anunciam apenas o nome do arquivo.',
    impact: 'critical',
    pageUrl: `${DEMO_URL}/`,
    elementSelector: 'header > img.hero-banner',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
    reviewStatus: 'confirmed',
    reviewNote: 'Confirmado com NVDA: a imagem é lida como "banner-2026-final.png".',
  },
  {
    ruleId: 'label',
    title: 'Campos de formulário devem ter rótulos',
    description: 'O campo de busca não possui rótulo associado nem aria-label.',
    impact: 'critical',
    pageUrl: `${DEMO_URL}/servicos`,
    elementSelector: '#busca',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
    reviewStatus: 'unreviewed',
    reviewNote: null,
  },
  {
    ruleId: 'color-contrast',
    title: 'Elementos devem ter contraste de cor suficiente',
    description: 'Texto cinza claro (#9ca3af) sobre fundo branco tem contraste de 2,5:1; o mínimo é 4,5:1.',
    impact: 'serious',
    pageUrl: `${DEMO_URL}/`,
    elementSelector: 'footer .legal-text',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
    reviewStatus: 'unreviewed',
    reviewNote: null,
  },
  {
    ruleId: 'button-name',
    title: 'Botões devem ter texto discernível',
    description: 'O botão de menu contém apenas um ícone SVG sem nome acessível.',
    impact: 'critical',
    pageUrl: `${DEMO_URL}/`,
    elementSelector: 'button.menu-toggle',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/button-name',
    reviewStatus: 'needs_context',
    reviewNote: 'Verificar se há texto oculto aplicado via CSS em outra folha de estilo.',
  },
  {
    ruleId: 'link-name',
    title: 'Links devem ter texto discernível',
    description: 'Ícones de redes sociais são links sem texto alternativo.',
    impact: 'serious',
    pageUrl: `${DEMO_URL}/contato`,
    elementSelector: 'footer .social a',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/link-name',
    reviewStatus: 'unreviewed',
    reviewNote: null,
  },
  {
    ruleId: 'heading-order',
    title: 'Níveis de título devem aumentar de um em um',
    description: 'A página salta de h1 para h4, dificultando a navegação por títulos.',
    impact: 'moderate',
    pageUrl: `${DEMO_URL}/servicos`,
    elementSelector: 'main h4',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/heading-order',
    reviewStatus: 'unreviewed',
    reviewNote: null,
  },
  {
    ruleId: 'region',
    title: 'Todo o conteúdo deve estar contido em landmarks',
    description: 'Avisos de cookies ficam fora de qualquer região (main, nav, footer).',
    impact: 'moderate',
    pageUrl: `${DEMO_URL}/`,
    elementSelector: 'div.cookie-banner',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/region',
    reviewStatus: 'false_positive',
    reviewNote: 'Banner é renderizado dentro de <aside> após a interação; não se aplica ao estado final.',
  },
  {
    ruleId: 'target-size',
    title: 'Alvos de toque devem ter tamanho suficiente',
    description: 'Links de paginação têm 16×16 px; o mínimo recomendado pela WCAG 2.2 é 24×24 px.',
    impact: 'minor',
    pageUrl: `${DEMO_URL}/noticias`,
    elementSelector: 'nav.pagination a',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/target-size',
    reviewStatus: 'unreviewed',
    reviewNote: null,
  },
];

/**
 * Duas avaliações do mesmo cenário, com o simulador de demonstração, uma semana de
 * distância e "versões" diferentes: mostram a comparação pareada, a evolução entre
 * execuções e o histórico de revisão das regras.
 */
const DEMO_AI_SCENARIO = 'hiring-cerebral-palsy';

async function createDemoAiEvaluations(projectId: string, ownerId: string) {
  const scenario = getAiScenario(DEMO_AI_SCENARIO);
  if (!scenario?.referencePrompt) return;

  const runs = [
    { offset: 0, version: 'versão simulada 2026-09', daysAgo: 7, review: true },
    { offset: 2, version: 'versão simulada 2026-10', daysAgo: 0, review: false },
  ];

  for (const run of runs) {
    const draft = await prepareEvaluation({
      scenario,
      mode: 'paired',
      prompt: scenario.prompt,
      referencePrompt: scenario.referencePrompt,
      source: 'simulator',
      repetitions: 3,
      targetResponses: [],
      referenceResponses: [],
      modelName: null,
      modelVersion: run.version,
      secondOpinion: false,
      simulatorOffset: run.offset,
    });
    const createdAt = new Date(Date.now() - run.daysAgo * 24 * 60 * 60 * 1000 - 60 * 60 * 1000);
    const evaluation = await prisma.aiEvaluation.create({
      data: toCreateData(draft, { projectId, scenario, userId: ownerId, createdAt }),
    });
    // A avaliação antiga já foi revisada: alimenta o histórico de precisão das regras.
    if (run.review) {
      await prisma.aiFinding.updateMany({
        where: { evaluationId: evaluation.id },
        data: { reviewStatus: 'confirmed', reviewedById: ownerId, reviewedAt: createdAt, reviewNote: 'Confirmado na revisão do piloto.' },
      });
    }
  }
}

async function upsertUser(email: string, name: string, password: string, role: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash: await hashPassword(password), role },
  });
}

async function createDemoProject(ownerId: string) {
  const now = Date.now();
  const startedAt = new Date(now - 1000 * 60 * 60 * 26);
  const finishedAt = new Date(startedAt.getTime() + 1000 * 95);

  const project = await prisma.project.create({
    data: {
      name: DEMO_PROJECT_NAME,
      description: 'Projeto demonstrativo: barreiras de interface (WCAG) e vieses em respostas de IA.',
      createdById: ownerId,
      targets: {
        create: {
          name: 'Portal Exemplo',
          startUrl: DEMO_URL,
          description: 'Ambiente controlado de demonstração para testes de acessibilidade.',
          authorizationConfirmedAt: startedAt,
        },
      },
    },
    include: { targets: true },
  });

  await prisma.auditRun.create({
    data: {
      targetId: project.targets[0].id,
      status: 'completed',
      createdById: ownerId,
      createdAt: startedAt,
      startedAt,
      finishedAt,
      toolVersion: 'axe-core 4.10 · dados de demonstração (seed)',
      configuration: JSON.stringify({ maxPages: 20, maxDepth: 3, demo: true }),
      findings: {
        create: DEMO_FINDINGS.map((finding) => ({
          ...finding,
          reviewedById: finding.reviewStatus === 'unreviewed' ? null : ownerId,
          reviewedAt: finding.reviewStatus === 'unreviewed' ? null : finishedAt,
        })),
      },
    },
  });

  await createDemoAiEvaluations(project.id, ownerId);

  return project;
}

async function main() {
  console.log('Iniciando seed do banco de dados Incluvia (SQLite)...');

  const admin = await upsertUser('admin@incluvia.local', 'Administrador Incluvia', 'Admin@123456', UserRole.admin);
  const auditor = await upsertUser('auditor@incluvia.local', 'Auditor Especialista', 'Auditor@123456', UserRole.auditor);
  console.log(`Usuários configurados: ${admin.email}, ${auditor.email}`);

  const existing = await prisma.project.findFirst({
    where: { name: DEMO_PROJECT_NAME, createdById: auditor.id },
  });

  if (existing) {
    console.log('Projeto demonstrativo já existe — nada a fazer.');
  } else {
    const project = await createDemoProject(auditor.id);
    console.log(`Projeto demonstrativo criado com ID: ${project.id}`);
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
