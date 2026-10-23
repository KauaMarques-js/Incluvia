import { prisma } from '../lib/prisma';
import { runAuditEngine } from '../lib/audit-engine';
import env from '../lib/config';

let isShuttingDown = false;

process.on('SIGINT', () => {
  console.log('\n[AuditWorker] Recebido SIGINT. Finalizando tarefas graciosamente...');
  isShuttingDown = true;
});

process.on('SIGTERM', () => {
  console.log('\n[AuditWorker] Recebido SIGTERM. Finalizando...');
  isShuttingDown = true;
});

/**
 * Process a single queued audit run.
 */
export async function processNextQueuedRun(): Promise<boolean> {
  // Find oldest queued run
  const run = await prisma.auditRun.findFirst({
    where: { status: 'queued' },
    orderBy: { createdAt: 'asc' },
    include: {
      target: true,
    },
  });

  if (!run) {
    return false;
  }

  console.log(`[AuditWorker] Iniciando execução ${run.id} para alvo: ${run.target.startUrl}`);

  // Transition to running
  await prisma.auditRun.update({
    where: { id: run.id },
    data: {
      status: 'running',
      startedAt: new Date(),
    },
  });

  let config: any = {};
  try {
    config = typeof run.configuration === 'string' ? JSON.parse(run.configuration) : (run.configuration || {});
  } catch {
    config = {};
  }

  try {
    const result = await runAuditEngine({
      startUrl: run.target.startUrl,
      maxPages: config.maxPages ?? 20,
      maxDepth: config.maxDepth ?? 3,
      timeoutMs: config.timeoutMs ?? 120000,
    });

    // Check if audit was cancelled while running
    const currentRun = await prisma.auditRun.findUnique({
      where: { id: run.id },
      select: { status: true },
    });

    if (currentRun?.status === 'cancelled') {
      console.log(`[AuditWorker] Execução ${run.id} foi cancelada pelo usuário durante o processamento.`);
      return true;
    }

    // Persist findings in a transaction
    if (result.findings.length > 0) {
      await prisma.finding.createMany({
        data: result.findings.map((f) => ({
          auditRunId: run.id,
          ruleId: f.ruleId,
          title: f.title,
          description: f.description,
          impact: f.impact,
          pageUrl: f.pageUrl,
          elementSelector: f.elementSelector || null,
          helpUrl: f.helpUrl || null,
          reviewStatus: 'unreviewed',
        })),
      });
    }

    // Mark as completed
    await prisma.auditRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        toolVersion: result.toolVersion,
      },
    });

    console.log(
      `[AuditWorker] Execução ${run.id} concluída com sucesso: ${result.pagesAudited} páginas auditadas, ${result.findings.length} achados persistidos.`
    );

    return true;
  } catch (error: any) {
    console.error(`[AuditWorker] Erro ao processar execução ${run.id}:`, error?.message || error);

    // Check if was cancelled
    const currentRun = await prisma.auditRun.findUnique({
      where: { id: run.id },
      select: { status: true },
    });

    if (currentRun?.status !== 'cancelled') {
      await prisma.auditRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          errorCode: (error?.message || 'UNKNOWN_ERROR').slice(0, 200),
        },
      });
    }

    return true;
  }
}

/**
 * Worker main loop
 */
async function startWorker() {
  console.log('[AuditWorker] Incluvia Audit Worker iniciado. Aguardando execuções na fila...');
  const pollInterval = env.worker.pollIntervalMs;

  const runOnce = process.argv.includes('--once');

  while (!isShuttingDown) {
    try {
      const processed = await processNextQueuedRun();
      if (runOnce) {
        break;
      }
      if (!processed) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    } catch (loopErr) {
      console.error('[AuditWorker] Erro no loop do worker:', loopErr);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  console.log('[AuditWorker] Worker encerrado.');
  await prisma.$disconnect();
}

if (require.main === module || process.argv[1]?.endsWith('audit-worker.ts')) {
  startWorker().catch((err) => {
    console.error('[AuditWorker] Erro fatal no worker:', err);
    process.exit(1);
  });
}
